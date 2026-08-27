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
var CrmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CrmService = CrmService_1 = class CrmService {
    prisma;
    logger = new common_1.Logger(CrmService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCompanies(userId) {
        return this.prisma.company.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { jobs: true, recruiters: true },
                },
                jobs: {
                    where: { isArchived: false },
                    select: { id: true, title: true, location: true, workMode: true },
                    take: 3,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async getCompanyById(userId, companyId) {
        const company = await this.prisma.company.findFirst({
            where: { id: companyId, userId },
            include: {
                recruiters: true,
                jobs: {
                    where: { isArchived: false },
                    include: {
                        application: { select: { status: true, appliedAt: true } },
                        matchResults: { orderBy: { createdAt: 'desc' }, take: 1 },
                    },
                },
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    async createCompany(userId, dto) {
        return this.prisma.company.create({
            data: {
                userId,
                name: dto.name,
                websiteUrl: dto.websiteUrl || null,
                domain: dto.domain || null,
                logoUrl: dto.logoUrl || null,
                industry: dto.industry || null,
                companySize: dto.companySize || null,
                headquarters: dto.headquarters || null,
                notes: dto.notes || null,
            },
        });
    }
    async updateCompany(userId, companyId, dto) {
        const company = await this.prisma.company.findFirst({
            where: { id: companyId, userId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return this.prisma.company.update({
            where: { id: companyId },
            data: {
                name: dto.name,
                websiteUrl: dto.websiteUrl,
                domain: dto.domain,
                logoUrl: dto.logoUrl,
                industry: dto.industry,
                companySize: dto.companySize,
                headquarters: dto.headquarters,
                notes: dto.notes,
            },
        });
    }
    async deleteCompany(userId, companyId) {
        const company = await this.prisma.company.findFirst({
            where: { id: companyId, userId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return this.prisma.company.delete({
            where: { id: companyId },
        });
    }
    async getRecruiters(userId) {
        return this.prisma.recruiter.findMany({
            where: { userId },
            include: {
                company: { select: { id: true, name: true, logoUrl: true } },
                _count: { select: { jobs: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async createRecruiter(userId, dto) {
        return this.prisma.recruiter.create({
            data: {
                userId,
                companyId: dto.companyId || null,
                name: dto.name,
                role: dto.roleTitle || null,
                email: dto.email || null,
                phone: dto.phone || null,
                linkedinUrl: dto.linkedinUrl || null,
                notes: dto.notes || null,
            },
            include: {
                company: { select: { id: true, name: true } },
            },
        });
    }
    async updateRecruiter(userId, recruiterId, dto) {
        const recruiter = await this.prisma.recruiter.findFirst({
            where: { id: recruiterId, userId },
        });
        if (!recruiter) {
            throw new common_1.NotFoundException('Recruiter not found');
        }
        return this.prisma.recruiter.update({
            where: { id: recruiterId },
            data: {
                companyId: dto.companyId,
                name: dto.name,
                role: dto.roleTitle,
                email: dto.email,
                phone: dto.phone,
                linkedinUrl: dto.linkedinUrl,
                notes: dto.notes,
            },
            include: {
                company: { select: { id: true, name: true } },
            },
        });
    }
    async deleteRecruiter(userId, recruiterId) {
        const recruiter = await this.prisma.recruiter.findFirst({
            where: { id: recruiterId, userId },
        });
        if (!recruiter) {
            throw new common_1.NotFoundException('Recruiter not found');
        }
        return this.prisma.recruiter.delete({
            where: { id: recruiterId },
        });
    }
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = CrmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrmService);
//# sourceMappingURL=crm.service.js.map