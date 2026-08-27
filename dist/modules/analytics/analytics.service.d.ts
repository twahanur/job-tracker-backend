import { PrismaService } from '../../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getCareerAnalytics(userId: string): Promise<{
        platformStats: Record<string, {
            total: number;
            applied: number;
            interview: number;
            offer: number;
        }>;
        workModeCounts: Record<string, number>;
        salaryMetrics: {
            analyzedJobs: number;
            avgMinSalary: number;
            avgMaxSalary: number;
            salaryCurrency: string;
        };
        velocityMetrics: {
            avgDaysToInterview: number;
            totalApplicationsTracked: number;
        };
        skillsIntelligence: {
            topSkills: {
                skill: string;
                count: number;
            }[];
            candidateSkills: string[];
        };
    }>;
}
