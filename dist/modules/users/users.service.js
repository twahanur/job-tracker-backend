"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
                candidateProfile: true,
                _count: {
                    select: {
                        cvs: true,
                        jobs: true,
                        notifications: { where: { isRead: false } },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateProfile(userId, dto) {
        const { name, ...profileData } = dto;
        if (name) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { name },
            });
        }
        const updatedProfile = await this.prisma.candidateProfile.upsert({
            where: { userId },
            update: {
                ...profileData,
            },
            create: {
                userId,
                headline: profileData.headline || 'Candidate',
                bio: profileData.bio,
                skills: profileData.skills || [],
                targetRoles: profileData.targetRoles || [],
                preferredLocations: profileData.preferredLocations || [],
                workModePreferences: profileData.workModePreferences || [],
                minExpectedSalary: profileData.minExpectedSalary,
                targetSalary: profileData.targetSalary,
                currency: profileData.currency || 'USD',
                noticePeriodDays: profileData.noticePeriodDays || 30,
                portfolioUrl: profileData.portfolioUrl,
                linkedinUrl: profileData.linkedinUrl,
                githubUrl: profileData.githubUrl,
            },
        });
        return this.getProfile(userId);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map