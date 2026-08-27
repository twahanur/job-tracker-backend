"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DashboardService = DashboardService_1 = class DashboardService {
    prisma;
    logger = new common_1.Logger(DashboardService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    getJobDomain(title, skills = []) {
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
    async getDashboardStats(userId, query) {
        const timeframe = query?.timeframe || 'all';
        const stageFilter = query?.stage && query.stage !== 'ALL' && query.stage !== 'All Stages' ? query.stage.toUpperCase() : null;
        const domainFilter = query?.domain && query.domain !== 'ALL' && query.domain !== 'All Domains' ? query.domain : null;
        const chartMode = query?.chartMode || 'monthly';
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        let timeframeCutoff = null;
        if (timeframe === '7d') {
            timeframeCutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        }
        else if (timeframe === '30d') {
            timeframeCutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        }
        else if (timeframe === '90d') {
            timeframeCutoff = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
        }
        else if (timeframe === '1y' || timeframe === 'This Year') {
            timeframeCutoff = new Date(now.getFullYear(), 0, 1);
        }
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const [allUserJobs, totalCvs, allApplications, allMatchResults, pendingFollowUps, recentHistory,] = await Promise.all([
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
        const discoveredDomainsSet = new Set();
        for (const job of allUserJobs) {
            discoveredDomainsSet.add(this.getJobDomain(job.title, job.requiredSkills));
        }
        const availableDomains = ['All Domains', ...Array.from(discoveredDomainsSet).sort()];
        const filteredJobs = allUserJobs.filter((job) => {
            if (timeframeCutoff && new Date(job.createdAt) < timeframeCutoff)
                return false;
            if (domainFilter && this.getJobDomain(job.title, job.requiredSkills) !== domainFilter)
                return false;
            return true;
        });
        const filteredApplications = allApplications.filter((app) => {
            if (timeframeCutoff && new Date(app.createdAt) < timeframeCutoff)
                return false;
            if (domainFilter && this.getJobDomain(app.job.title, app.job.requiredSkills) !== domainFilter)
                return false;
            if (stageFilter) {
                const s = app.status;
                if (stageFilter === 'SAVED' && !(s === client_1.ApplicationStatus.SAVED || s === client_1.ApplicationStatus.MATCHED || s === client_1.ApplicationStatus.DRAFTED))
                    return false;
                if (stageFilter === 'APPLIED' && s !== client_1.ApplicationStatus.APPLIED)
                    return false;
                if (stageFilter === 'SCREENING' && s !== client_1.ApplicationStatus.PHONE_SCREEN)
                    return false;
                if (stageFilter === 'TECHNICAL' && s !== client_1.ApplicationStatus.TECHNICAL_ASSESSMENT)
                    return false;
                if (stageFilter === 'INTERVIEW' && !(s === client_1.ApplicationStatus.FIRST_ROUND_INTERVIEW || s === client_1.ApplicationStatus.FINAL_ROUND_INTERVIEW))
                    return false;
                if (stageFilter === 'OFFER' && !(s === client_1.ApplicationStatus.OFFER_RECEIVED || s === client_1.ApplicationStatus.OFFER_ACCEPTED))
                    return false;
                if (stageFilter === 'REJECTED' && !(s === client_1.ApplicationStatus.REJECTED || s === client_1.ApplicationStatus.WITHDRAWN || s === client_1.ApplicationStatus.GHOSTED))
                    return false;
            }
            return true;
        });
        const thisMonthJobsCount = allUserJobs.filter((j) => new Date(j.createdAt) >= startOfCurrentMonth).length;
        const lastMonthJobsCount = allUserJobs.filter((j) => new Date(j.createdAt) >= startOfLastMonth && new Date(j.createdAt) < startOfCurrentMonth).length;
        let momJobGrowth = 0;
        if (lastMonthJobsCount > 0) {
            momJobGrowth = Math.round(((thisMonthJobsCount - lastMonthJobsCount) / lastMonthJobsCount) * 100);
        }
        else if (thisMonthJobsCount > 0) {
            momJobGrowth = 100;
        }
        const pipelineCounts = {
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
        const followUpNeededApps = [];
        for (const app of filteredApplications) {
            const status = app.status;
            if (status === client_1.ApplicationStatus.SAVED || status === client_1.ApplicationStatus.MATCHED || status === client_1.ApplicationStatus.DRAFTED) {
                pipelineCounts.SAVED++;
            }
            else if (status === client_1.ApplicationStatus.APPLIED) {
                pipelineCounts.APPLIED++;
                appliedCount++;
                if (app.appliedAt && new Date(app.appliedAt) <= sevenDaysAgo) {
                    followUpNeededApps.push(app);
                }
            }
            else if (status === client_1.ApplicationStatus.PHONE_SCREEN) {
                pipelineCounts.SCREENING++;
                appliedCount++;
                interviewCount++;
            }
            else if (status === client_1.ApplicationStatus.TECHNICAL_ASSESSMENT) {
                pipelineCounts.TECHNICAL++;
                appliedCount++;
                interviewCount++;
            }
            else if (status === client_1.ApplicationStatus.FIRST_ROUND_INTERVIEW ||
                status === client_1.ApplicationStatus.FINAL_ROUND_INTERVIEW) {
                pipelineCounts.INTERVIEW++;
                appliedCount++;
                interviewCount++;
            }
            else if (status === client_1.ApplicationStatus.OFFER_RECEIVED ||
                status === client_1.ApplicationStatus.OFFER_ACCEPTED) {
                pipelineCounts.OFFER++;
                appliedCount++;
                offerCount++;
            }
            else if (status === client_1.ApplicationStatus.REJECTED ||
                status === client_1.ApplicationStatus.WITHDRAWN ||
                status === client_1.ApplicationStatus.GHOSTED) {
                pipelineCounts.REJECTED++;
            }
        }
        const totalOutreach = Math.max(appliedCount, 1);
        const conversionRate = appliedCount > 0 ? Math.round(((interviewCount + offerCount) / totalOutreach) * 100) : 0;
        const relevantScores = allMatchResults.map((r) => r.overallScore);
        const avgMatchScore = relevantScores.length > 0
            ? Math.round(relevantScores.reduce((acc, curr) => acc + curr, 0) / relevantScores.length)
            : 0;
        const matchTrend = relevantScores.length >= 2
            ? relevantScores.slice(-8)
            : relevantScores.length === 1
                ? [relevantScores[0], relevantScores[0]]
                : [0, 0];
        const velocityTrend = [
            pipelineCounts.SAVED,
            pipelineCounts.APPLIED,
            pipelineCounts.SCREENING,
            pipelineCounts.TECHNICAL,
            pipelineCounts.INTERVIEW,
            pipelineCounts.OFFER,
        ];
        const activityTimeline = [];
        if (chartMode === 'weekly') {
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
        }
        else if (chartMode === '6m') {
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
        }
        else {
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
        const maxTotalActivity = Math.max(...activityTimeline.map((item) => item.total), 1);
        for (const item of activityTimeline) {
            item.val = item.total > 0 ? Math.max(12, Math.round((item.total / maxTotalActivity) * 100)) : 6;
        }
        const topOpportunities = filteredApplications
            .filter((a) => a.job?.matchResults?.[0]?.overallScore !== undefined)
            .sort((a, b) => (b.job.matchResults[0]?.overallScore || 0) -
            (a.job.matchResults[0]?.overallScore || 0))
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
                status: j.application?.status || client_1.ApplicationStatus.SAVED,
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
    async completeFollowUp(userId, followUpId) {
        const followUp = await this.prisma.followUpSchedule.findFirst({
            where: {
                id: followUpId,
                application: { job: { userId } },
            },
        });
        if (!followUp) {
            throw new common_1.NotFoundException('Follow-up reminder not found');
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map