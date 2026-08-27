import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';

export interface DashboardQueryDto {
  timeframe?: string; // '7d' | '30d' | '90d' | '1y' | 'all'
  stage?: string;     // 'ALL' | 'SAVED' | 'APPLIED' | 'SCREENING' | 'TECHNICAL' | 'INTERVIEW' | 'OFFER' | 'REJECTED'
  domain?: string;    // 'ALL' | 'Engineering' | 'Design' | 'Product' | 'Data & AI' | 'Marketing' | string
  chartMode?: string; // 'monthly' | '6m' | 'weekly'
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Helper to classify a job into a standard domain
   */
  private getJobDomain(title: string, skills: string[] = []): string {
    const text = `${title} ${skills.join(' ')}`.toLowerCase();
    if (/(engineer|developer|frontend|backend|fullstack|software|react|node|typescript|javascript|python|golang|java|devops|cloud|architect|mobile|ios|android)/i.test(text)) {
      return 'Engineering';
    }
    if (/(data|analyst|machine learning|ai|ml|deep learning|nlp|llm|scientist|bi|analytics)/i.test(text)) {
      return 'Data & AI';
    }
    if (/(product manager|product owner|scrum master|program manager|project manager)/i.test(text)) {
      return 'Product';
    }
    if (/(design|designer|ui|ux|graphic|visual|figma|product designer)/i.test(text)) {
      return 'Design';
    }
    if (/(marketing|growth|seo|content|social media|copywriter|community)/i.test(text)) {
      return 'Marketing';
    }
    if (/(sales|account executive|business development|bdr|sdr)/i.test(text)) {
      return 'Sales & BD';
    }
    return 'General Tech';
  }

  /**
   * Calculate comprehensive dynamic dashboard metrics and pipeline intelligence
   */
  async getDashboardStats(userId: string, query?: DashboardQueryDto) {
    const timeframe = query?.timeframe || 'all';
    const stageFilter = query?.stage && query.stage !== 'ALL' && query.stage !== 'All Stages' ? query.stage.toUpperCase() : null;
    const domainFilter = query?.domain && query.domain !== 'ALL' && query.domain !== 'All Domains' ? query.domain : null;
    const chartMode = query?.chartMode || 'monthly';

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Compute timeframe cutoff date
    let timeframeCutoff: Date | null = null;
    if (timeframe === '7d') {
      timeframeCutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    } else if (timeframe === '30d') {
      timeframeCutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    } else if (timeframe === '90d') {
      timeframeCutoff = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    } else if (timeframe === '1y' || timeframe === 'This Year') {
      timeframeCutoff = new Date(now.getFullYear(), 0, 1);
    }

    // Dates for Month-over-Month calculation
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 1. Fetch total counts and data
    const [
      allUserJobs,
      totalCvs,
      allApplications,
      allMatchResults,
      pendingFollowUps,
      recentHistory,
    ] = await Promise.all([
      this.prisma.job.findMany({
        where: { userId, isArchived: false },
        include: {
          company: true,
          matchResults: { orderBy: { createdAt: 'desc' }, take: 1 },
          application: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cV.count({ where: { userId } }),
      this.prisma.application.findMany({
        where: { job: { userId, isArchived: false } },
        include: {
          job: {
            include: {
              company: true,
              matchResults: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.jobMatchResult.findMany({
        where: { job: { userId } },
        select: { overallScore: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.followUpSchedule.findMany({
        where: {
          application: { job: { userId } },
          isCompleted: false,
        },
        include: {
          application: {
            include: { job: { include: { company: true } } },
          },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 8,
      }),
      this.prisma.applicationHistory.findMany({
        where: { application: { job: { userId } } },
        include: {
          application: {
            include: { job: { include: { company: true } } },
          },
        },
        orderBy: { changedAt: 'desc' },
        take: 8,
      }),
    ]);

    // 2. Discover available domains dynamically
    const discoveredDomainsSet = new Set<string>();
    for (const job of allUserJobs) {
      discoveredDomainsSet.add(this.getJobDomain(job.title, job.requiredSkills));
    }
    const availableDomains = ['All Domains', ...Array.from(discoveredDomainsSet).sort()];

    // 3. Filter jobs & applications by active filters (timeframe, domain, stage)
    const filteredJobs = allUserJobs.filter((job) => {
      if (timeframeCutoff && new Date(job.createdAt) < timeframeCutoff) return false;
      if (domainFilter && this.getJobDomain(job.title, job.requiredSkills) !== domainFilter) return false;
      return true;
    });

    const filteredApplications = allApplications.filter((app) => {
      if (timeframeCutoff && new Date(app.createdAt) < timeframeCutoff) return false;
      if (domainFilter && this.getJobDomain(app.job.title, app.job.requiredSkills) !== domainFilter) return false;
      if (stageFilter) {
        const s = app.status;
        if (stageFilter === 'SAVED' && !(s === ApplicationStatus.SAVED || s === ApplicationStatus.MATCHED || s === ApplicationStatus.DRAFTED)) return false;
        if (stageFilter === 'APPLIED' && s !== ApplicationStatus.APPLIED) return false;
        if (stageFilter === 'SCREENING' && s !== ApplicationStatus.PHONE_SCREEN) return false;
        if (stageFilter === 'TECHNICAL' && s !== ApplicationStatus.TECHNICAL_ASSESSMENT) return false;
        if (stageFilter === 'INTERVIEW' && !(s === ApplicationStatus.FIRST_ROUND_INTERVIEW || s === ApplicationStatus.FINAL_ROUND_INTERVIEW)) return false;
        if (stageFilter === 'OFFER' && !(s === ApplicationStatus.OFFER_RECEIVED || s === ApplicationStatus.OFFER_ACCEPTED)) return false;
        if (stageFilter === 'REJECTED' && !(s === ApplicationStatus.REJECTED || s === ApplicationStatus.WITHDRAWN || s === ApplicationStatus.GHOSTED)) return false;
      }
      return true;
    });

    // 4. Compute Month-over-Month (MoM) Growth
    const thisMonthJobsCount = allUserJobs.filter((j) => new Date(j.createdAt) >= startOfCurrentMonth).length;
    const lastMonthJobsCount = allUserJobs.filter(
      (j) => new Date(j.createdAt) >= startOfLastMonth && new Date(j.createdAt) < startOfCurrentMonth,
    ).length;

    let momJobGrowth = 0;
    if (lastMonthJobsCount > 0) {
      momJobGrowth = Math.round(((thisMonthJobsCount - lastMonthJobsCount) / lastMonthJobsCount) * 100);
    } else if (thisMonthJobsCount > 0) {
      momJobGrowth = 100;
    }

    // 5. Compute Pipeline breakdown
    const pipelineCounts: Record<string, number> = {
      SAVED: 0,
      APPLIED: 0,
      SCREENING: 0,
      TECHNICAL: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
    };

    let appliedCount = 0;
    let interviewCount = 0;
    let offerCount = 0;

    const followUpNeededApps: any[] = [];

    for (const app of filteredApplications) {
      const status = app.status;

      if (status === ApplicationStatus.SAVED || status === ApplicationStatus.MATCHED || status === ApplicationStatus.DRAFTED) {
        pipelineCounts.SAVED++;
      } else if (status === ApplicationStatus.APPLIED) {
        pipelineCounts.APPLIED++;
        appliedCount++;

        // If applied more than 7 days ago and still in APPLIED status, flag for follow-up
        if (app.appliedAt && new Date(app.appliedAt) <= sevenDaysAgo) {
          followUpNeededApps.push(app);
        }
      } else if (status === ApplicationStatus.PHONE_SCREEN) {
        pipelineCounts.SCREENING++;
        appliedCount++;
        interviewCount++;
      } else if (status === ApplicationStatus.TECHNICAL_ASSESSMENT) {
        pipelineCounts.TECHNICAL++;
        appliedCount++;
        interviewCount++;
      } else if (
        status === ApplicationStatus.FIRST_ROUND_INTERVIEW ||
        status === ApplicationStatus.FINAL_ROUND_INTERVIEW
      ) {
        pipelineCounts.INTERVIEW++;
        appliedCount++;
        interviewCount++;
      } else if (
        status === ApplicationStatus.OFFER_RECEIVED ||
        status === ApplicationStatus.OFFER_ACCEPTED
      ) {
        pipelineCounts.OFFER++;
        appliedCount++;
        offerCount++;
      } else if (
        status === ApplicationStatus.REJECTED ||
        status === ApplicationStatus.WITHDRAWN ||
        status === ApplicationStatus.GHOSTED
      ) {
        pipelineCounts.REJECTED++;
      }
    }

    // 6. Conversion Rate & Average Match Score
    const totalOutreach = Math.max(appliedCount, 1);
    const conversionRate = appliedCount > 0 ? Math.round(((interviewCount + offerCount) / totalOutreach) * 100) : 0;

    const relevantScores = allMatchResults.map((r) => r.overallScore);
    const avgMatchScore =
      relevantScores.length > 0
        ? Math.round(relevantScores.reduce((acc, curr) => acc + curr, 0) / relevantScores.length)
        : 0;

    // 7. Dynamic Sparkline Trends
    // Match score trend: Last 8 evaluation scores or interpolated curve
    const matchTrend =
      relevantScores.length >= 2
        ? relevantScores.slice(-8)
        : relevantScores.length === 1
        ? [relevantScores[0], relevantScores[0]]
        : [0, 0];

    // Conversion velocity trend based on progression count
    const velocityTrend = [
      pipelineCounts.SAVED,
      pipelineCounts.APPLIED,
      pipelineCounts.SCREENING,
      pipelineCounts.TECHNICAL,
      pipelineCounts.INTERVIEW,
      pipelineCounts.OFFER,
    ];

    // 8. Dynamic Activity Timeline Bar Chart
    const activityTimeline: Array<{ label: string; jobsCount: number; appliedCount: number; total: number; val: number }> = [];

    if (chartMode === 'weekly') {
      // Last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i * 7 + 6) * 24 * 3600 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
        const label = `W${8 - i}`;

        const jobsInWeek = allUserJobs.filter((j) => {
          const d = new Date(j.createdAt);
          return d >= weekStart && d <= weekEnd;
        }).length;

        const appsInWeek = allApplications.filter((a) => {
          const d = new Date(a.createdAt);
          return d >= weekStart && d <= weekEnd;
        }).length;

        const total = jobsInWeek + appsInWeek;
        activityTimeline.push({ label, jobsCount: jobsInWeek, appliedCount: appsInWeek, total, val: 0 });
      }
    } else if (chartMode === '6m') {
      // Last 6 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = targetDate.getMonth();
        const y = targetDate.getFullYear();
        const label = monthNames[m];

        const jobsInMonth = allUserJobs.filter((j) => {
          const d = new Date(j.createdAt);
          return d.getFullYear() === y && d.getMonth() === m;
        }).length;

        const appsInMonth = allApplications.filter((a) => {
          const d = new Date(a.createdAt);
          return d.getFullYear() === y && d.getMonth() === m;
        }).length;

        const total = jobsInMonth + appsInMonth;
        activityTimeline.push({ label, jobsCount: jobsInMonth, appliedCount: appsInMonth, total, val: 0 });
      }
    } else {
      // Default: Current Year 12 Months (Jan - Dec)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = now.getFullYear();

      for (let m = 0; m < 12; m++) {
        const label = monthNames[m];

        const jobsInMonth = allUserJobs.filter((j) => {
          const d = new Date(j.createdAt);
          return d.getFullYear() === currentYear && d.getMonth() === m;
        }).length;

        const appsInMonth = allApplications.filter((a) => {
          const d = new Date(a.createdAt);
          return d.getFullYear() === currentYear && d.getMonth() === m;
        }).length;

        const total = jobsInMonth + appsInMonth;
        activityTimeline.push({ label, jobsCount: jobsInMonth, appliedCount: appsInMonth, total, val: 0 });
      }
    }

    // Normalize bar heights (val % between 6% and 100%)
    const maxTotalActivity = Math.max(...activityTimeline.map((item) => item.total), 1);
    for (const item of activityTimeline) {
      item.val = item.total > 0 ? Math.max(12, Math.round((item.total / maxTotalActivity) * 100)) : 6;
    }

    // 9. Top high-match evaluated opportunities
    const topOpportunities: Array<{
      id: string;
      applicationId: string | null;
      title: string;
      companyName: string;
      location: string | null;
      workMode: any;
      minSalary: any;
      maxSalary: any;
      salaryCurrency: string;
      matchScore: number | undefined;
      recommendation: any;
      status: any;
      domain: string;
      updatedAt: Date;
    }> = filteredApplications
      .filter((a) => a.job?.matchResults?.[0]?.overallScore !== undefined)
      .sort(
        (a, b) =>
          (b.job.matchResults[0]?.overallScore || 0) -
          (a.job.matchResults[0]?.overallScore || 0),
      )
      .slice(0, 5)
      .map((a) => ({
        id: a.job.id,
        applicationId: a.id,
        title: a.job.title,
        companyName: a.job.company?.name || 'Company',
        location: a.job.location,
        workMode: a.job.workMode,
        minSalary: a.job.minSalary,
        maxSalary: a.job.maxSalary,
        salaryCurrency: a.job.salaryCurrency,
        matchScore: a.job.matchResults[0]?.overallScore,
        recommendation: a.job.matchResults[0]?.recommendation,
        status: a.status,
        domain: this.getJobDomain(a.job.title, a.job.requiredSkills),
        updatedAt: a.updatedAt,
      }));

    // If no evaluated applications found, also check recent jobs with matches
    if (topOpportunities.length === 0) {
      const matchJobs = filteredJobs
        .filter((j) => j.matchResults?.[0]?.overallScore !== undefined)
        .sort((a, b) => (b.matchResults[0]?.overallScore || 0) - (a.matchResults[0]?.overallScore || 0))
        .slice(0, 5)
        .map((j) => ({
          id: j.id,
          applicationId: j.application?.id || null,
          title: j.title,
          companyName: j.company?.name || 'Company',
          location: j.location,
          workMode: j.workMode,
          minSalary: j.minSalary,
          maxSalary: j.maxSalary,
          salaryCurrency: j.salaryCurrency,
          matchScore: j.matchResults[0]?.overallScore,
          recommendation: j.matchResults[0]?.recommendation,
          status: j.application?.status || ApplicationStatus.SAVED,
          domain: this.getJobDomain(j.title, j.requiredSkills),
          updatedAt: j.updatedAt,
        }));
      topOpportunities.push(...matchJobs);
    }

    return {
      kpi: {
        totalJobs: filteredJobs.length,
        allTotalJobs: allUserJobs.length,
        totalCvs,
        activeApplications: filteredApplications.length,
        appliedCount,
        interviewCount,
        offerCount,
        conversionRate,
        avgMatchScore,
        momJobGrowth,
        matchTrend,
        velocityTrend,
      },
      filters: {
        timeframe,
        stage: stageFilter || 'All Stages',
        domain: domainFilter || 'All Domains',
        availableDomains,
      },
      pipelineCounts,
      activityTimeline,
      followUpNeeded: followUpNeededApps.slice(0, 6).map((a) => ({
        id: a.id,
        jobId: a.job.id,
        title: a.job.title,
        companyName: a.job.company?.name || 'Company',
        appliedAt: a.appliedAt,
        daysSinceApplied: a.appliedAt
          ? Math.floor((now.getTime() - new Date(a.appliedAt).getTime()) / (1000 * 3600 * 24))
          : 0,
      })),
      pendingFollowUps: pendingFollowUps.map((f) => ({
        id: f.id,
        applicationId: f.applicationId,
        title: f.reminderTitle,
        jobTitle: f.application.job.title,
        companyName: f.application.job.company?.name || 'Company',
        scheduledDate: f.scheduledDate,
        notes: f.notes,
        isCompleted: f.isCompleted,
      })),
      recentActivity: recentHistory.map((h) => ({
        id: h.id,
        applicationId: h.applicationId,
        jobTitle: h.application.job.title,
        companyName: h.application.job.company?.name || 'Company',
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        changedAt: h.changedAt,
        notes: h.notes,
      })),
      topOpportunities,
    };
  }

  /**
   * Mark a follow-up reminder as completed
   */
  async completeFollowUp(userId: string, followUpId: string) {
    const followUp = await this.prisma.followUpSchedule.findFirst({
      where: {
        id: followUpId,
        application: { job: { userId } },
      },
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up reminder not found');
    }

    const updated = await this.prisma.followUpSchedule.update({
      where: { id: followUpId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return updated;
  }
}

