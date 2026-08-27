import { MatchingService } from './matching.service';
import { MatchJobDto } from './dto/match-job.dto';
export declare class MatchingController {
    private matchingService;
    constructor(matchingService: MatchingService);
    evaluateMatch(userId: string, jobId: string, dto: MatchJobDto): Promise<{
        message: string;
        data: {
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
        };
    }>;
    getMatchHistory(userId: string, jobId: string): Promise<{
        message: string;
        data: ({
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
        })[];
    }>;
}
