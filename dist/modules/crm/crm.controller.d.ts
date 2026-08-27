import { CrmService } from './crm.service';
import { CreateCompanyDto, UpdateCompanyDto, CreateRecruiterDto, UpdateRecruiterDto } from './dto/crm.dto';
export declare class CrmController {
    private crmService;
    constructor(crmService: CrmService);
    getCompanies(userId: string): Promise<{
        message: string;
        data: ({
            jobs: {
                id: string;
                title: string;
                location: string | null;
                workMode: import("@prisma/client").$Enums.WorkMode;
            }[];
            _count: {
                jobs: number;
                recruiters: number;
            };
        } & {
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
        })[];
    }>;
    getCompanyById(userId: string, companyId: string): Promise<{
        message: string;
        data: {
            jobs: ({
                application: {
                    status: import("@prisma/client").$Enums.ApplicationStatus;
                    appliedAt: Date | null;
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
            })[];
            recruiters: {
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
            }[];
        } & {
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
        };
    }>;
    createCompany(userId: string, dto: CreateCompanyDto): Promise<{
        message: string;
        data: {
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
        };
    }>;
    updateCompany(userId: string, companyId: string, dto: UpdateCompanyDto): Promise<{
        message: string;
        data: {
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
        };
    }>;
    deleteCompany(userId: string, companyId: string): Promise<{
        message: string;
    }>;
    getRecruiters(userId: string): Promise<{
        message: string;
        data: ({
            company: {
                name: string;
                id: string;
                logoUrl: string | null;
            } | null;
            _count: {
                jobs: number;
            };
        } & {
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
        })[];
    }>;
    createRecruiter(userId: string, dto: CreateRecruiterDto): Promise<{
        message: string;
        data: {
            company: {
                name: string;
                id: string;
            } | null;
        } & {
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
        };
    }>;
    updateRecruiter(userId: string, recruiterId: string, dto: UpdateRecruiterDto): Promise<{
        message: string;
        data: {
            company: {
                name: string;
                id: string;
            } | null;
        } & {
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
        };
    }>;
    deleteRecruiter(userId: string, recruiterId: string): Promise<{
        message: string;
    }>;
}
