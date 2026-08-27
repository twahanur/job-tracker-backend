import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, response: Response): Promise<{
        message: string;
        user: {
            email: string;
            name: string;
            id: string;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto, response: Response): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            avatarUrl: string | null;
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
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(request: Request, dto: RefreshTokenDto, response: Response): Promise<{
        message: string;
        user: {
            email: string;
            name: string;
            id: string;
            role: import("@prisma/client").$Enums.Role;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    logout(response: Response): Promise<{
        message: string;
    }>;
    getProfile(user: any): Promise<{
        user: any;
    }>;
    private setAuthCookies;
}
