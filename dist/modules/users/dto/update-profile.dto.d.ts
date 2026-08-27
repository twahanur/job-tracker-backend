import { WorkMode } from '@prisma/client';
export declare class UpdateProfileDto {
    name?: string;
    headline?: string;
    bio?: string;
    targetRoles?: string[];
    skills?: string[];
    preferredLocations?: string[];
    workModePreferences?: WorkMode[];
    minExpectedSalary?: number;
    targetSalary?: number;
    currency?: string;
    noticePeriodDays?: number;
    portfolioUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
}
