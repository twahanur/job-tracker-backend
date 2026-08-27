import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApplicationStatus, WorkMode } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate comprehensive deep career analytics, platform ROI, and skill demand
   */
  async getCareerAnalytics(userId: string) {
    const [jobs, applications, cvs] = await Promise.all([
      this.prisma.job.findMany({
        where: { userId, isArchived: false },
        include: {
          matchResults: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.application.findMany({
        where: { job: { userId } },
        include: {
          job: true,
          statusHistory: { orderBy: { changedAt: 'asc' } },
        },
      }),
      this.prisma.cV.findMany({
        where: { userId, isPrimary: true },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      }),
    ]);

    // 1. Source Platform Performance Breakdown
    const platformStats: Record<string, { total: number; applied: number; interview: number; offer: number }> = {
      LINKEDIN: { total: 0, applied: 0, interview: 0, offer: 0 },
      INDEED: { total: 0, applied: 0, interview: 0, offer: 0 },
      GREENHOUSE: { total: 0, applied: 0, interview: 0, offer: 0 },
      LEVER: { total: 0, applied: 0, interview: 0, offer: 0 },
      WELLFOUND: { total: 0, applied: 0, interview: 0, offer: 0 },
      MANUAL: { total: 0, applied: 0, interview: 0, offer: 0 },
      OTHER: { total: 0, applied: 0, interview: 0, offer: 0 },
    };

    // 2. Work Mode Distribution
    const workModeCounts: Record<string, number> = {
      REMOTE: 0,
      HYBRID: 0,
      ONSITE: 0,
    };

    // 3. Salary Aggregate Calculations
    let validSalaryCount = 0;
    let totalMinSalary = 0;
    let totalMaxSalary = 0;

    // 4. In-Demand Skills Frequency
    const skillFrequency: Record<string, number> = {};

    for (const job of jobs) {
      const p = (job.sourcePlatform as string) || 'MANUAL';
      if (!platformStats[p]) {
        platformStats[p] = { total: 0, applied: 0, interview: 0, offer: 0 };
      }
      platformStats[p].total++;

      if (job.workMode) {
        workModeCounts[job.workMode] = (workModeCounts[job.workMode] || 0) + 1;
      }

      if (job.minSalary && job.maxSalary) {
        validSalaryCount++;
        totalMinSalary += Number(job.minSalary);
        totalMaxSalary += Number(job.maxSalary);
      }

      for (const skill of job.requiredSkills) {
        const normalized = skill.trim();
        skillFrequency[normalized] = (skillFrequency[normalized] || 0) + 1;
      }
    }

    // Process Applications for Platform Conversion & Velocity
    let totalDaysToInterview = 0;
    let interviewTimeCount = 0;

    for (const app of applications) {
      const platform = (app.job.sourcePlatform as string) || 'MANUAL';
      if (platformStats[platform]) {
        if (app.status !== ApplicationStatus.SAVED && app.status !== ApplicationStatus.MATCHED) {
          platformStats[platform].applied++;
        }

        if (
          app.status === ApplicationStatus.PHONE_SCREEN ||
          app.status === ApplicationStatus.TECHNICAL_ASSESSMENT ||
          app.status === ApplicationStatus.FIRST_ROUND_INTERVIEW ||
          app.status === ApplicationStatus.FINAL_ROUND_INTERVIEW
        ) {
          platformStats[platform].interview++;
        }

        if (
          app.status === ApplicationStatus.OFFER_RECEIVED ||
          app.status === ApplicationStatus.OFFER_ACCEPTED
        ) {
          platformStats[platform].offer++;
        }
      }

      // Calculate cycle time if history exists
      if (app.appliedAt && app.statusHistory.length > 0) {
        const interviewChange = app.statusHistory.find(
          (h) =>
            h.newStatus === ApplicationStatus.PHONE_SCREEN ||
            h.newStatus === ApplicationStatus.FIRST_ROUND_INTERVIEW,
        );

        if (interviewChange) {
          const days = Math.max(
            1,
            Math.floor(
              (new Date(interviewChange.changedAt).getTime() - new Date(app.appliedAt).getTime()) /
                (1000 * 3600 * 24),
            ),
          );
          totalDaysToInterview += days;
          interviewTimeCount++;
        }
      }
    }

    const avgDaysToInterview =
      interviewTimeCount > 0 ? Math.round(totalDaysToInterview / interviewTimeCount) : 7;

    const avgSalaryRange =
      validSalaryCount > 0
        ? {
            avgMin: Math.round(totalMinSalary / validSalaryCount),
            avgMax: Math.round(totalMaxSalary / validSalaryCount),
          }
        : { avgMin: 0, avgMax: 0 };

    // Sort Top In-Demand Skills
    const topSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Candidate Profile primary skills
    let candidateSkills: string[] = [];
    if (cvs.length > 0 && cvs[0].versions.length > 0) {
      const parsed = cvs[0].versions[0].parsedData as any;
      candidateSkills = parsed?.primarySkills || [];
    }

    return {
      platformStats,
      workModeCounts,
      salaryMetrics: {
        analyzedJobs: validSalaryCount,
        avgMinSalary: avgSalaryRange.avgMin,
        avgMaxSalary: avgSalaryRange.avgMax,
        salaryCurrency: 'USD',
      },
      velocityMetrics: {
        avgDaysToInterview,
        totalApplicationsTracked: applications.length,
      },
      skillsIntelligence: {
        topSkills,
        candidateSkills,
      },
    };
  }
}
