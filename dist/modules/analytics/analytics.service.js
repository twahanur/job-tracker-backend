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
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    prisma;
    logger = new common_1.Logger(AnalyticsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCareerAnalytics(userId) {
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
        const platformStats = {
            LINKEDIN: { total: 0, applied: 0, interview: 0, offer: 0 },
            INDEED: { total: 0, applied: 0, interview: 0, offer: 0 },
            GREENHOUSE: { total: 0, applied: 0, interview: 0, offer: 0 },
            LEVER: { total: 0, applied: 0, interview: 0, offer: 0 },
            WELLFOUND: { total: 0, applied: 0, interview: 0, offer: 0 },
            MANUAL: { total: 0, applied: 0, interview: 0, offer: 0 },
            OTHER: { total: 0, applied: 0, interview: 0, offer: 0 },
        };
        const workModeCounts = {
            REMOTE: 0,
            HYBRID: 0,
            ONSITE: 0,
        };
        let validSalaryCount = 0;
        let totalMinSalary = 0;
        let totalMaxSalary = 0;
        const skillFrequency = {};
        for (const job of jobs) {
            const p = job.sourcePlatform || 'MANUAL';
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
        let totalDaysToInterview = 0;
        let interviewTimeCount = 0;
        for (const app of applications) {
            const platform = app.job.sourcePlatform || 'MANUAL';
            if (platformStats[platform]) {
                if (app.status !== client_1.ApplicationStatus.SAVED && app.status !== client_1.ApplicationStatus.MATCHED) {
                    platformStats[platform].applied++;
                }
                if (app.status === client_1.ApplicationStatus.PHONE_SCREEN ||
                    app.status === client_1.ApplicationStatus.TECHNICAL_ASSESSMENT ||
                    app.status === client_1.ApplicationStatus.FIRST_ROUND_INTERVIEW ||
                    app.status === client_1.ApplicationStatus.FINAL_ROUND_INTERVIEW) {
                    platformStats[platform].interview++;
                }
                if (app.status === client_1.ApplicationStatus.OFFER_RECEIVED ||
                    app.status === client_1.ApplicationStatus.OFFER_ACCEPTED) {
                    platformStats[platform].offer++;
                }
            }
            if (app.appliedAt && app.statusHistory.length > 0) {
                const interviewChange = app.statusHistory.find((h) => h.newStatus === client_1.ApplicationStatus.PHONE_SCREEN ||
                    h.newStatus === client_1.ApplicationStatus.FIRST_ROUND_INTERVIEW);
                if (interviewChange) {
                    const days = Math.max(1, Math.floor((new Date(interviewChange.changedAt).getTime() - new Date(app.appliedAt).getTime()) /
                        (1000 * 3600 * 24)));
                    totalDaysToInterview += days;
                    interviewTimeCount++;
                }
            }
        }
        const avgDaysToInterview = interviewTimeCount > 0 ? Math.round(totalDaysToInterview / interviewTimeCount) : 7;
        const avgSalaryRange = validSalaryCount > 0
            ? {
                avgMin: Math.round(totalMinSalary / validSalaryCount),
                avgMax: Math.round(totalMaxSalary / validSalaryCount),
            }
            : { avgMin: 0, avgMax: 0 };
        const topSkills = Object.entries(skillFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([skill, count]) => ({ skill, count }));
        let candidateSkills = [];
        if (cvs.length > 0 && cvs[0].versions.length > 0) {
            const parsed = cvs[0].versions[0].parsedData;
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map