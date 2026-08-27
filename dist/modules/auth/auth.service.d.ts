import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            email: string;
            name: string;
            id: string;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
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
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            email: string;
            name: string;
            id: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    private generateTokens;
}
