import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { CreateCvDto, UpdateParsedCvDto } from './dto/create-cv.dto';
export declare class CvService {
    private prisma;
    private geminiService;
    private readonly logger;
    constructor(prisma: PrismaService, geminiService: GeminiService);
    uploadAndParseCv(userId: string, file: Express.Multer.File, dto: CreateCvDto): Promise<{
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
    }>;
    uploadNewVersion(userId: string, cvId: string, file: Express.Multer.File): Promise<{
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
    }>;
    getUserCvs(userId: string): Promise<({
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
    })[]>;
    getCvById(userId: string, cvId: string): Promise<{
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
    }>;
    setPrimaryCv(userId: string, cvId: string): Promise<{
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
    }>;
    updateParsedData(userId: string, cvId: string, dto: UpdateParsedCvDto): Promise<{
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
    }>;
    deleteCv(userId: string, cvId: string): Promise<{
        message: string;
    }>;
    private syncToProfile;
}
