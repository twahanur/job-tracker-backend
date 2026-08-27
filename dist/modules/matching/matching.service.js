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
var MatchingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const gemini_service_1 = require("../ai/gemini.service");
const client_1 = require("@prisma/client");
let MatchingService = MatchingService_1 = class MatchingService {
    prisma;
    geminiService;
    logger = new common_1.Logger(MatchingService_1.name);
    constructor(prisma, geminiService) {
        this.prisma = prisma;
        this.geminiService = geminiService;
    }
    async evaluateMatch(userId, jobId, dto) {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, userId },
            include: { company: true, application: true },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        let cv = null;
        if (dto.cvId) {
            cv = await this.prisma.cV.findFirst({
                where: { id: dto.cvId, userId },
                include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
            });
        }
        else {
            cv = await this.prisma.cV.findFirst({
                where: { userId, isPrimary: true },
                include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
            });
            if (!cv) {
                cv = await this.prisma.cV.findFirst({
                    where: { userId },
                    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
                    orderBy: { createdAt: 'desc' },
                });
            }
        }
        if (!cv || cv.versions.length === 0) {
            throw new common_1.BadRequestException('No CV found in your vault. Please upload a CV first before running match evaluation.');
        }
        const latestCvVersion = cv.versions[0];
        const structuredCv = latestCvVersion.parsedData;
        const structuredJob = {
            title: job.title,
            companyName: job.company?.name || 'Company',
            location: job.location || undefined,
            country: job.country || undefined,
            workMode: job.workMode,
            jobType: job.jobType,
            experienceRequired: job.experienceRequired || undefined,
            minSalary: job.minSalary ? Number(job.minSalary) : undefined,
            maxSalary: job.maxSalary ? Number(job.maxSalary) : undefined,
            salaryCurrency: job.salaryCurrency,
            salaryPeriod: job.salaryPeriod,
            description: job.description,
            responsibilities: job.responsibilities,
            requirements: job.requirements,
            requiredSkills: job.requiredSkills,
            preferredSkills: job.preferredSkills,
            benefits: job.benefits,
            deadline: job.deadline ? job.deadline.toISOString() : undefined,
        };
        this.logger.log(`Evaluating match for Job ${job.title} vs CV ${cv.title} (v${latestCvVersion.versionNumber})...`);
        const matchAnalysis = await this.geminiService.evaluateJobMatch(structuredCv, structuredJob);
        let recommendation = client_1.RecommendationTier.LOW_MATCH;
        if (matchAnalysis.overallScore >= 85) {
            recommendation = client_1.RecommendationTier.HIGHLY_RECOMMENDED;
        }
        else if (matchAnalysis.overallScore >= 70) {
            recommendation = client_1.RecommendationTier.RECOMMENDED;
        }
        else if (matchAnalysis.overallScore >= 50) {
            recommendation = client_1.RecommendationTier.MODERATE_MATCH;
        }
        const savedResult = await this.prisma.jobMatchResult.create({
            data: {
                jobId: job.id,
                cvId: cv.id,
                cvVersionNumber: latestCvVersion.versionNumber,
                overallScore: matchAnalysis.overallScore,
                recommendation,
                skillsScore: matchAnalysis.breakdown.skillsScore,
                experienceScore: matchAnalysis.breakdown.experienceScore,
                educationScore: matchAnalysis.breakdown.educationScore,
                locationScore: matchAnalysis.breakdown.locationScore,
                salaryScore: matchAnalysis.breakdown.salaryScore,
                matchedSkills: matchAnalysis.matchedSkills,
                missingSkills: matchAnalysis.missingSkills,
                partialSkills: matchAnalysis.partialSkills,
                strengths: matchAnalysis.strengths,
                gaps: matchAnalysis.gaps,
                actionableTips: matchAnalysis.actionableTips,
                explanation: matchAnalysis.explanation,
            },
            include: {
                cv: { select: { id: true, title: true, isPrimary: true } },
            },
        });
        if (job.application && job.application.status === client_1.ApplicationStatus.SAVED) {
            await this.prisma.application.update({
                where: { id: job.application.id },
                data: {
                    status: client_1.ApplicationStatus.MATCHED,
                    selectedCvId: cv.id,
                },
            });
        }
        return savedResult;
    }
    async getJobMatchResults(userId, jobId) {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, userId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        return this.prisma.jobMatchResult.findMany({
            where: { jobId },
            include: {
                cv: { select: { id: true, title: true, isPrimary: true, currentVersion: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = MatchingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gemini_service_1.GeminiService])
], MatchingService);
//# sourceMappingURL=matching.service.js.map