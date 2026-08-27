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
var ApplicationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const gemini_service_1 = require("../ai/gemini.service");
const client_1 = require("@prisma/client");
let ApplicationsService = ApplicationsService_1 = class ApplicationsService {
    prisma;
    geminiService;
    logger = new common_1.Logger(ApplicationsService_1.name);
    constructor(prisma, geminiService) {
        this.prisma = prisma;
        this.geminiService = geminiService;
    }
    async getApplications(userId) {
        return this.prisma.application.findMany({
            where: {
                job: { userId, isArchived: false },
            },
            include: {
                job: {
                    include: {
                        company: true,
                        recruiter: true,
                        matchResults: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
                selectedCv: { select: { id: true, title: true } },
                followUps: {
                    where: { isCompleted: false },
                    orderBy: { scheduledDate: 'asc' },
                },
                emails: {
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async getApplicationById(userId, applicationId) {
        const application = await this.prisma.application.findFirst({
            where: {
                id: applicationId,
                job: { userId },
            },
            include: {
                job: {
                    include: {
                        company: true,
                        recruiter: true,
                        matchResults: {
                            include: { cv: { select: { id: true, title: true } } },
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
                selectedCv: true,
                statusHistory: { orderBy: { changedAt: 'desc' } },
                emails: { orderBy: { createdAt: 'desc' } },
                followUps: { orderBy: { scheduledDate: 'asc' } },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        return application;
    }
    async updateStatus(userId, applicationId, dto) {
        const application = await this.prisma.application.findFirst({
            where: {
                id: applicationId,
                job: { userId },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        const previousStatus = application.status;
        const isApplyingNow = dto.status === client_1.ApplicationStatus.APPLIED && !application.appliedAt;
        const updated = await this.prisma.application.update({
            where: { id: applicationId },
            data: {
                status: dto.status,
                appliedAt: isApplyingNow
                    ? dto.appliedAt
                        ? new Date(dto.appliedAt)
                        : new Date()
                    : application.appliedAt,
                statusHistory: {
                    create: {
                        previousStatus,
                        newStatus: dto.status,
                        notes: dto.notes || null,
                    },
                },
            },
            include: {
                job: {
                    include: { company: true },
                },
                statusHistory: { orderBy: { changedAt: 'desc' } },
            },
        });
        return updated;
    }
    async updateDetails(userId, applicationId, dto) {
        const application = await this.prisma.application.findFirst({
            where: {
                id: applicationId,
                job: { userId },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        return this.prisma.application.update({
            where: { id: applicationId },
            data: {
                selectedCvId: dto.selectedCvId,
                expectedSalary: dto.expectedSalary,
                salaryCurrency: dto.salaryCurrency,
                portalUrl: dto.portalUrl,
                applicationNotes: dto.applicationNotes,
            },
            include: {
                selectedCv: { select: { id: true, title: true } },
            },
        });
    }
    async generateEmailDraft(userId, applicationId, dto) {
        const application = await this.prisma.application.findFirst({
            where: {
                id: applicationId,
                job: { userId },
            },
            include: {
                job: { include: { company: true, recruiter: true } },
                selectedCv: {
                    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
                },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        let cv = application.selectedCv;
        if (!cv) {
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
            throw new common_1.BadRequestException('Please upload a CV to generate personalized emails.');
        }
        const structuredCv = cv.versions[0].parsedData;
        const structuredJob = {
            title: application.job.title,
            companyName: application.job.company?.name || 'Company',
            location: application.job.location || undefined,
            workMode: application.job.workMode,
            jobType: application.job.jobType,
            salaryCurrency: application.job.salaryCurrency,
            salaryPeriod: application.job.salaryPeriod,
            description: application.job.description,
            responsibilities: application.job.responsibilities,
            requirements: application.job.requirements,
            requiredSkills: application.job.requiredSkills,
            preferredSkills: application.job.preferredSkills,
            benefits: application.job.benefits,
        };
        const recipientEmail = dto.recipientEmail?.trim() || application.job.recruiter?.email || null;
        const recruiterName = dto.recruiterName?.trim() || application.job.recruiter?.name || undefined;
        this.logger.log(`Generating ${dto.type} email draft (${dto.tone || 'PROFESSIONAL'}) via Gemini Flash for recipient: ${recipientEmail || 'N/A'}...`);
        const draft = await this.geminiService.generateEmailDraft({
            type: dto.type,
            job: structuredJob,
            cv: structuredCv,
            recruiterName,
            tone: dto.tone,
            customInstructions: dto.customInstructions || dto.customNotes,
            customNotes: dto.customNotes,
        });
        const savedDraft = await this.prisma.emailDraft.create({
            data: {
                applicationId,
                type: dto.type,
                recipientName: recruiterName || null,
                recipientEmail,
                subject: draft.subject,
                bodyMarkdown: draft.bodyMarkdown,
                status: client_1.EmailStatus.DRAFT,
            },
        });
        return savedDraft;
    }
    async updateEmailDraft(userId, emailId, dto) {
        const draft = await this.prisma.emailDraft.findFirst({
            where: {
                id: emailId,
                application: { job: { userId } },
            },
        });
        if (!draft) {
            throw new common_1.NotFoundException('Email draft not found');
        }
        const isSending = dto.status === client_1.EmailStatus.SENT;
        const updated = await this.prisma.emailDraft.update({
            where: { id: emailId },
            data: {
                recipientName: dto.recipientName !== undefined ? dto.recipientName : draft.recipientName,
                recipientEmail: dto.recipientEmail !== undefined ? dto.recipientEmail : draft.recipientEmail,
                subject: dto.subject !== undefined ? dto.subject : draft.subject,
                bodyMarkdown: dto.bodyMarkdown !== undefined ? dto.bodyMarkdown : draft.bodyMarkdown,
                status: dto.status !== undefined ? dto.status : draft.status,
                sentAt: isSending ? (draft.sentAt || new Date()) : draft.sentAt,
            },
        });
        if (isSending) {
            const app = await this.prisma.application.findUnique({
                where: { id: draft.applicationId },
            });
            if (app &&
                (app.status === client_1.ApplicationStatus.SAVED ||
                    app.status === client_1.ApplicationStatus.DRAFTED ||
                    app.status === client_1.ApplicationStatus.MATCHED)) {
                await this.prisma.application.update({
                    where: { id: draft.applicationId },
                    data: {
                        status: client_1.ApplicationStatus.APPLIED,
                        appliedAt: new Date(),
                    },
                });
            }
        }
        return updated;
    }
    async scheduleFollowUp(userId, applicationId, dto) {
        const application = await this.prisma.application.findFirst({
            where: {
                id: applicationId,
                job: { userId },
            },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        return this.prisma.followUpSchedule.create({
            data: {
                applicationId,
                scheduledDate: new Date(dto.scheduledDate),
                reminderTitle: dto.reminderTitle,
                notes: dto.notes || null,
            },
        });
    }
    async completeFollowUp(userId, followUpId) {
        const followUp = await this.prisma.followUpSchedule.findFirst({
            where: {
                id: followUpId,
                application: { job: { userId } },
            },
        });
        if (!followUp) {
            throw new common_1.NotFoundException('Follow-up schedule not found');
        }
        return this.prisma.followUpSchedule.update({
            where: { id: followUpId },
            data: {
                isCompleted: true,
                completedAt: new Date(),
            },
        });
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = ApplicationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gemini_service_1.GeminiService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map