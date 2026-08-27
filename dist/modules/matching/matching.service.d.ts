import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { MatchJobDto } from './dto/match-job.dto';
export declare class MatchingService {
    private prisma;
    private geminiService;
    private readonly logger;
    constructor(prisma: PrismaService, geminiService: GeminiService);
    evaluateMatch(userId: string, jobId: string, dto: MatchJobDto): Promise<{
        cv: {
            id: string;
            title: string;
            isPrimary: boolean;
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
    }>;
    getJobMatchResults(userId: string, jobId: string): Promise<({
        cv: {
            id: string;
            title: string;
            isPrimary: boolean;
            currentVersion: number;
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
    })[]>;
}
