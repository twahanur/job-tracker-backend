import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateRecruiterDto,
  UpdateRecruiterDto,
} from './dto/crm.dto';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(private prisma: PrismaService) {}

  // ================= COMPANY CRM =================

  async getCompanies(userId: string) {
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

  async getCompanyById(userId: string, companyId: string) {
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
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async createCompany(userId: string, dto: CreateCompanyDto) {
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

  async updateCompany(userId: string, companyId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
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

  async deleteCompany(userId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.delete({
      where: { id: companyId },
    });
  }

  // ================= RECRUITER CRM =================

  async getRecruiters(userId: string) {
    return this.prisma.recruiter.findMany({
      where: { userId },
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
        _count: { select: { jobs: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createRecruiter(userId: string, dto: CreateRecruiterDto) {
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

  async updateRecruiter(userId: string, recruiterId: string, dto: UpdateRecruiterDto) {
    const recruiter = await this.prisma.recruiter.findFirst({
      where: { id: recruiterId, userId },
    });

    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
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

  async deleteRecruiter(userId: string, recruiterId: string) {
    const recruiter = await this.prisma.recruiter.findFirst({
      where: { id: recruiterId, userId },
    });

    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    return this.prisma.recruiter.delete({
      where: { id: recruiterId },
    });
  }
}
