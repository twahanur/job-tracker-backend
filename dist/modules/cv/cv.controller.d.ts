import { CvService } from './cv.service';
import { CreateCvDto, UpdateParsedCvDto } from './dto/create-cv.dto';
export declare class CvController {
    private cvService;
    constructor(cvService: CvService);
    uploadCv(userId: string, file: Express.Multer.File, dto: CreateCvDto): Promise<{
        message: string;
        data: {
            versions: {
                id: string;
                createdAt: Date;
                summary: string | null;
                parsedData: import("@prisma/client/runtime/library").JsonValue;
                versionNumber: number;
                fileUrl: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                rawText: string;
                cvId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            isPrimary: boolean;
            currentVersion: number;
        };
    }>;
    uploadNewVersion(userId: string, cvId: string, file: Express.Multer.File): Promise<{
        message: string;
        data: {
            versions: {
                id: string;
                createdAt: Date;
                summary: string | null;
                parsedData: import("@prisma/client/runtime/library").JsonValue;
                versionNumber: number;
                fileUrl: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                rawText: string;
                cvId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            isPrimary: boolean;
            currentVersion: number;
        };
    }>;
    getMyCvs(userId: string): Promise<{
        message: string;
        data: ({
            _count: {
                matchResults: number;
                applications: number;
            };
            versions: {
                id: string;
                createdAt: Date;
                summary: string | null;
                parsedData: import("@prisma/client/runtime/library").JsonValue;
                versionNumber: number;
                fileUrl: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                rawText: string;
                cvId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            isPrimary: boolean;
            currentVersion: number;
        })[];
    }>;
    getCvDetails(userId: string, cvId: string): Promise<{
        message: string;
        data: {
            versions: {
                id: string;
                createdAt: Date;
                summary: string | null;
                parsedData: import("@prisma/client/runtime/library").JsonValue;
                versionNumber: number;
                fileUrl: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                rawText: string;
                cvId: string;
            }[];
            matchResults: ({
                job: {
                    id: string;
                    title: string;
                    location: string | null;
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
            isPrimary: boolean;
            currentVersion: number;
        };
    }>;
    setPrimary(userId: string, cvId: string): Promise<{
        message: string;
        data: {
            versions: {
                id: string;
                createdAt: Date;
                summary: string | null;
                parsedData: import("@prisma/client/runtime/library").JsonValue;
                versionNumber: number;
                fileUrl: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                rawText: string;
                cvId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            isPrimary: boolean;
            currentVersion: number;
        };
    }>;
    updateParsedData(userId: string, cvId: string, dto: UpdateParsedCvDto): Promise<{
        message: string;
        data: {
            versions: {
                id: string;
                createdAt: Date;
                summary: string | null;
                parsedData: import("@prisma/client/runtime/library").JsonValue;
                versionNumber: number;
                fileUrl: string;
                fileName: string;
                fileSize: number;
                mimeType: string;
                rawText: string;
                cvId: string;
            }[];
            matchResults: ({
                job: {
                    id: string;
                    title: string;
                    location: string | null;
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
            isPrimary: boolean;
            currentVersion: number;
        };
    }>;
    deleteCv(userId: string, cvId: string): Promise<{
        message: string;
    }>;
}
