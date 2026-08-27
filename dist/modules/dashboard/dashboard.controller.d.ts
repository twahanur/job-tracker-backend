import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboardStats(userId: string, timeframe?: string, stage?: string, domain?: string, chartMode?: string): Promise<{
        message: string;
        data: {
            kpi: {
                totalJobs: number;
                allTotalJobs: number;
                totalCvs: number;
                activeApplications: number;
                appliedCount: number;
                interviewCount: number;
                offerCount: number;
                conversionRate: number;
                avgMatchScore: number;
                momJobGrowth: number;
                matchTrend: number[];
                velocityTrend: number[];
            };
            filters: {
                timeframe: string;
                stage: string;
                domain: string;
                availableDomains: string[];
            };
            pipelineCounts: Record<string, number>;
            activityTimeline: {
                label: string;
                jobsCount: number;
                appliedCount: number;
                total: number;
                val: number;
            }[];
            followUpNeeded: {
                id: any;
                jobId: any;
                title: any;
                companyName: any;
                appliedAt: any;
                daysSinceApplied: number;
            }[];
            pendingFollowUps: {
                id: string;
                applicationId: string;
                title: string;
                jobTitle: string;
                companyName: string;
                scheduledDate: Date;
                notes: string | null;
                isCompleted: boolean;
            }[];
            recentActivity: {
                id: string;
                applicationId: string;
                jobTitle: string;
                companyName: string;
                previousStatus: import("@prisma/client").$Enums.ApplicationStatus | null;
                newStatus: import("@prisma/client").$Enums.ApplicationStatus;
                changedAt: Date;
                notes: string | null;
            }[];
            topOpportunities: {
                id: string;
                applicationId: string | null;
                title: string;
                companyName: string;
                location: string | null;
                workMode: any;
                minSalary: any;
                maxSalary: any;
                salaryCurrency: string;
                matchScore: number | undefined;
                recommendation: any;
                status: any;
                domain: string;
                updatedAt: Date;
            }[];
        };
    }>;
    completeReminder(userId: string, reminderId: string): Promise<{
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
