import { ApplicationsService } from './applications.service';
import { UpdateApplicationStatusDto, UpdateApplicationDetailsDto, GenerateEmailDto, UpdateEmailDraftDto, CreateFollowUpDto } from './dto/update-status.dto';
export declare class ApplicationsController {
    private applicationsService;
    constructor(applicationsService: ApplicationsService);
    getApplications(userId: string): Promise<{
        message: string;
        data: ({
            job: {
                company: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    notes: string | null;
                    websiteUrl: string | null;
                    domain: string | null;
                    logoUrl: string | null;
                    industry: string | null;
                    companySize: string | null;
                    headquarters: string | null;
                } | null;
                recruiter: {
                    email: string | null;
                    name: string;
                    id: string;
                    role: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    linkedinUrl: string | null;
                    userId: string;
                    companyId: string | null;
                    notes: string | null;
                    phone: string | null;
                } | null;
                matchResults: {
                    id: string;
                    createdAt: Date;
                    cvId: string;
                    jobId: string;
                    cvVersionNumber: number;
                    overallScore: number;
                    recommendation: import("@prisma/client").$Enums.RecommendationTier;
                    skillsScore: number;
                    experienceScore: number;
                    educationScore: number;
                    locationScore: number;
                    salaryScore: number;
                    matchedSkills: string[];
                    missingSkills: string[];
                    partialSkills: string[];
                    strengths: string[];
                    gaps: string[];
                    actionableTips: string[];
                    explanation: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                title: string;
                companyId: string | null;
                recruiterId: string | null;
                sourceUrl: string | null;
                sourcePlatform: import("@prisma/client").$Enums.JobSource;
                rawContent: string | null;
                contentHash: string | null;
                ingestionStatus: import("@prisma/client").$Enums.IngestionStatus;
                location: string | null;
                country: string | null;
                workMode: import("@prisma/client").$Enums.WorkMode;
                jobType: import("@prisma/client").$Enums.JobType;
                experienceRequired: string | null;
                minSalary: import("@prisma/client/runtime/library").Decimal | null;
                maxSalary: import("@prisma/client/runtime/library").Decimal | null;
                salaryCurrency: string;
                salaryPeriod: string;
                description: string;
                responsibilities: string[];
                requirements: string[];
                requiredSkills: string[];
                preferredSkills: string[];
                benefits: string[];
                deadline: Date | null;
                postedAt: Date | null;
                isArchived: boolean;
            };
            selectedCv: {
                id: string;
                title: string;
            } | null;
            emails: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                subject: string;
                bodyMarkdown: string;
                status: import("@prisma/client").$Enums.EmailStatus;
                applicationId: string;
                type: import("@prisma/client").$Enums.EmailType;
                recipientEmail: string | null;
                recipientName: string | null;
                bodyHtml: string | null;
                sentAt: Date | null;
            }[];
            followUps: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                applicationId: string;
                scheduledDate: Date;
                reminderTitle: string;
                isCompleted: boolean;
                completedAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            salaryCurrency: string;
            jobId: string;
            expectedSalary: import("@prisma/client/runtime/library").Decimal | null;
            applicationNotes: string | null;
            portalUrl: string | null;
            selectedCvId: string | null;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            appliedAt: Date | null;
        })[];
    }>;
    getApplicationById(userId: string, id: string): Promise<{
        message: string;
        data: {
            job: {
                company: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    notes: string | null;
                    websiteUrl: string | null;
                    domain: string | null;
                    logoUrl: string | null;
                    industry: string | null;
                    companySize: string | null;
                    headquarters: string | null;
                } | null;
                recruiter: {
                    email: string | null;
                    name: string;
                    id: string;
                    role: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    linkedinUrl: string | null;
                    userId: string;
                    companyId: string | null;
                    notes: string | null;
                    phone: string | null;
                } | null;
                matchResults: ({
                    cv: {
                        id: string;
                        title: string;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    cvId: string;
                    jobId: string;
                    cvVersionNumber: number;
                    overallScore: number;
                    recommendation: import("@prisma/client").$Enums.RecommendationTier;
                    skillsScore: number;
                    experienceScore: number;
                    educationScore: number;
                    locationScore: number;
                    salaryScore: number;
                    matchedSkills: string[];
                    missingSkills: string[];
                    partialSkills: string[];
                    strengths: string[];
                    gaps: string[];
                    actionableTips: string[];
                    explanation: string;
                })[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                title: string;
                companyId: string | null;
                recruiterId: string | null;
                sourceUrl: string | null;
                sourcePlatform: import("@prisma/client").$Enums.JobSource;
                rawContent: string | null;
                contentHash: string | null;
                ingestionStatus: import("@prisma/client").$Enums.IngestionStatus;
                location: string | null;
                country: string | null;
                workMode: import("@prisma/client").$Enums.WorkMode;
                jobType: import("@prisma/client").$Enums.JobType;
                experienceRequired: string | null;
                minSalary: import("@prisma/client/runtime/library").Decimal | null;
                maxSalary: import("@prisma/client/runtime/library").Decimal | null;
                salaryCurrency: string;
                salaryPeriod: string;
                description: string;
                responsibilities: string[];
                requirements: string[];
                requiredSkills: string[];
                preferredSkills: string[];
                benefits: string[];
                deadline: Date | null;
                postedAt: Date | null;
                isArchived: boolean;
            };
            selectedCv: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                title: string;
                isPrimary: boolean;
                currentVersion: number;
            } | null;
            emails: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                subject: string;
                bodyMarkdown: string;
                status: import("@prisma/client").$Enums.EmailStatus;
                applicationId: string;
                type: import("@prisma/client").$Enums.EmailType;
                recipientEmail: string | null;
                recipientName: string | null;
                bodyHtml: string | null;
                sentAt: Date | null;
            }[];
            followUps: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                applicationId: string;
                scheduledDate: Date;
                reminderTitle: string;
                isCompleted: boolean;
                completedAt: Date | null;
            }[];
            statusHistory: {
                id: string;
                notes: string | null;
                changedAt: Date;
                applicationId: string;
                previousStatus: import("@prisma/client").$Enums.ApplicationStatus | null;
                newStatus: import("@prisma/client").$Enums.ApplicationStatus;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            salaryCurrency: string;
            jobId: string;
            expectedSalary: import("@prisma/client/runtime/library").Decimal | null;
            applicationNotes: string | null;
            portalUrl: string | null;
            selectedCvId: string | null;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            appliedAt: Date | null;
        };
    }>;
    updateStatus(userId: string, id: string, dto: UpdateApplicationStatusDto): Promise<{
        message: string;
        data: {
            job: {
                company: {
                    name: string;
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    notes: string | null;
                    websiteUrl: string | null;
                    domain: string | null;
                    logoUrl: string | null;
                    industry: string | null;
                    companySize: string | null;
                    headquarters: string | null;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                title: string;
                companyId: string | null;
                recruiterId: string | null;
                sourceUrl: string | null;
                sourcePlatform: import("@prisma/client").$Enums.JobSource;
                rawContent: string | null;
                contentHash: string | null;
                ingestionStatus: import("@prisma/client").$Enums.IngestionStatus;
                location: string | null;
                country: string | null;
                workMode: import("@prisma/client").$Enums.WorkMode;
                jobType: import("@prisma/client").$Enums.JobType;
                experienceRequired: string | null;
                minSalary: import("@prisma/client/runtime/library").Decimal | null;
                maxSalary: import("@prisma/client/runtime/library").Decimal | null;
                salaryCurrency: string;
                salaryPeriod: string;
                description: string;
                responsibilities: string[];
                requirements: string[];
                requiredSkills: string[];
                preferredSkills: string[];
                benefits: string[];
                deadline: Date | null;
                postedAt: Date | null;
                isArchived: boolean;
            };
            statusHistory: {
                id: string;
                notes: string | null;
                changedAt: Date;
                applicationId: string;
                previousStatus: import("@prisma/client").$Enums.ApplicationStatus | null;
                newStatus: import("@prisma/client").$Enums.ApplicationStatus;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            salaryCurrency: string;
            jobId: string;
            expectedSalary: import("@prisma/client/runtime/library").Decimal | null;
            applicationNotes: string | null;
            portalUrl: string | null;
            selectedCvId: string | null;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            appliedAt: Date | null;
        };
    }>;
    updateDetails(userId: string, id: string, dto: UpdateApplicationDetailsDto): Promise<{
        message: string;
        data: {
            selectedCv: {
                id: string;
                title: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            salaryCurrency: string;
            jobId: string;
            expectedSalary: import("@prisma/client/runtime/library").Decimal | null;
            applicationNotes: string | null;
            portalUrl: string | null;
            selectedCvId: string | null;
            status: import("@prisma/client").$Enums.ApplicationStatus;
            appliedAt: Date | null;
        };
    }>;
    generateEmail(userId: string, id: string, dto: GenerateEmailDto): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            subject: string;
            bodyMarkdown: string;
            status: import("@prisma/client").$Enums.EmailStatus;
            applicationId: string;
            type: import("@prisma/client").$Enums.EmailType;
            recipientEmail: string | null;
            recipientName: string | null;
            bodyHtml: string | null;
            sentAt: Date | null;
        };
    }>;
    updateEmailDraft(userId: string, emailId: string, dto: UpdateEmailDraftDto): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            subject: string;
            bodyMarkdown: string;
            status: import("@prisma/client").$Enums.EmailStatus;
            applicationId: string;
            type: import("@prisma/client").$Enums.EmailType;
            recipientEmail: string | null;
            recipientName: string | null;
            bodyHtml: string | null;
            sentAt: Date | null;
        };
    }>;
    scheduleFollowUp(userId: string, id: string, dto: CreateFollowUpDto): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            applicationId: string;
            scheduledDate: Date;
            reminderTitle: string;
            isCompleted: boolean;
            completedAt: Date | null;
        };
    }>;
    completeFollowUp(userId: string, followUpId: string): Promise<{
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            applicationId: string;
            scheduledDate: Date;
            reminderTitle: string;
            isCompleted: boolean;
            completedAt: Date | null;
        };
    }>;
}
