import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<{
        message: string;
        data: {
            candidateProfile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                headline: string | null;
                bio: string | null;
                targetRoles: string[];
                skills: string[];
                preferredLocations: string[];
                workModePreferences: import("@prisma/client").$Enums.WorkMode[];
                minExpectedSalary: import("@prisma/client/runtime/library").Decimal | null;
                targetSalary: import("@prisma/client/runtime/library").Decimal | null;
                currency: string;
                noticePeriodDays: number | null;
                portfolioUrl: string | null;
                linkedinUrl: string | null;
                githubUrl: string | null;
                userId: string;
            } | null;
            email: string;
            name: string;
            id: string;
            avatarUrl: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            _count: {
                cvs: number;
                jobs: number;
                notifications: number;
            };
        };
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        message: string;
        data: {
            candidateProfile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                headline: string | null;
                bio: string | null;
                targetRoles: string[];
                skills: string[];
                preferredLocations: string[];
                workModePreferences: import("@prisma/client").$Enums.WorkMode[];
                minExpectedSalary: import("@prisma/client/runtime/library").Decimal | null;
                targetSalary: import("@prisma/client/runtime/library").Decimal | null;
                currency: string;
                noticePeriodDays: number | null;
                portfolioUrl: string | null;
                linkedinUrl: string | null;
                githubUrl: string | null;
                userId: string;
            } | null;
            email: string;
            name: string;
            id: string;
            avatarUrl: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            _count: {
                cvs: number;
                jobs: number;
                notifications: number;
            };
        };
    }>;
}
