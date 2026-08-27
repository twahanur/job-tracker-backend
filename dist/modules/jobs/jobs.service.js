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
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const axios_1 = require("axios");
const cheerio = require("cheerio");
const prisma_service_1 = require("../../prisma/prisma.service");
const gemini_service_1 = require("../ai/gemini.service");
const client_1 = require("@prisma/client");
let JobsService = JobsService_1 = class JobsService {
    prisma;
    geminiService;
    logger = new common_1.Logger(JobsService_1.name);
    constructor(prisma, geminiService) {
        this.prisma = prisma;
        this.geminiService = geminiService;
    }
    async extractJobPreview(userId, dto) {
        let rawText = dto.rawText || '';
        let sourcePlatform = client_1.JobSource.MANUAL;
        if (dto.url) {
            this.logger.log(`Scraping job URL: ${dto.url}`);
            try {
                const scraped = await this.scrapeJobUrl(dto.url);
                rawText = scraped.text;
                sourcePlatform = scraped.platform;
            }
            catch (err) {
                this.logger.error(`Failed to scrape URL: ${dto.url}`, err);
                throw new common_1.BadRequestException(`Could not scrape job from URL: ${err.message}`);
            }
        }
        if (!rawText.trim()) {
            throw new common_1.BadRequestException('Please provide either a valid job posting URL or paste the job description text');
        }
        const contentHash = this.generateContentHash(rawText);
        const existingJob = await this.prisma.job.findFirst({
            where: { userId, contentHash },
            include: { company: true, application: true },
        });
        this.logger.log('Extracting structured job fields via Gemini Flash...');
        const extractedData = await this.geminiService.extractJobDetails(rawText);
        return {
            extractedData,
            rawContent: rawText,
            contentHash,
            sourceUrl: dto.url || null,
            sourcePlatform,
            isDuplicate: !!existingJob,
            existingJobId: existingJob?.id || null,
        };
    }
    async createJob(userId, dto) {
        let companyId = null;
        if (dto.companyName) {
            const company = await this.prisma.company.upsert({
                where: {
                    userId_name: {
                        userId,
                        name: dto.companyName.trim(),
                    },
                },
                update: {},
                create: {
                    userId,
                    name: dto.companyName.trim(),
                },
            });
            companyId = company.id;
        }
        let recruiterId = null;
        const rName = dto.recruiterName?.trim() || (dto.recruiterEmail ? `${dto.companyName?.trim() || 'Hiring'} Team` : null);
        const rEmail = dto.recruiterEmail?.trim() || null;
        if (rName || rEmail) {
            let recruiter = null;
            if (rEmail) {
                recruiter = await this.prisma.recruiter.findFirst({
                    where: { userId, email: rEmail },
                });
            }
            if (!recruiter && rName && companyId) {
                recruiter = await this.prisma.recruiter.findFirst({
                    where: { userId, companyId, name: rName },
                });
            }
            if (!recruiter) {
                recruiter = await this.prisma.recruiter.create({
                    data: {
                        userId,
                        companyId,
                        name: rName || 'Hiring Team',
                        email: rEmail,
                        role: 'HR / Recruitment',
                    },
                });
            }
            else if (rEmail && !recruiter.email) {
                recruiter = await this.prisma.recruiter.update({
                    where: { id: recruiter.id },
                    data: { email: rEmail },
                });
            }
            recruiterId = recruiter?.id || null;
        }
        const contentHash = dto.contentHash || this.generateContentHash(dto.description);
        const job = await this.prisma.job.create({
            data: {
                userId,
                companyId,
                recruiterId,
                title: dto.title,
                sourceUrl: dto.sourceUrl || null,
                sourcePlatform: dto.sourcePlatform || client_1.JobSource.MANUAL,
                rawContent: dto.rawContent || dto.description,
                contentHash,
                location: dto.location || null,
                country: dto.country || null,
                workMode: dto.workMode || client_1.WorkMode.REMOTE,
                jobType: dto.jobType || client_1.JobType.FULL_TIME,
                experienceRequired: dto.experienceRequired || null,
                minSalary: dto.minSalary || null,
                maxSalary: dto.maxSalary || null,
                salaryCurrency: dto.salaryCurrency || 'USD',
                salaryPeriod: dto.salaryPeriod || 'YEARLY',
                description: dto.description,
                responsibilities: dto.responsibilities || [],
                requirements: dto.requirements || [],
                requiredSkills: dto.requiredSkills || [],
                preferredSkills: dto.preferredSkills || [],
                benefits: dto.benefits || [],
                deadline: dto.deadline ? new Date(dto.deadline) : null,
                application: {
                    create: {
                        status: dto.applicationStatus || client_1.ApplicationStatus.SAVED,
                        salaryCurrency: dto.expectedSalaryCurrency || dto.salaryCurrency || 'USD',
                        expectedSalary: dto.expectedSalary !== undefined && dto.expectedSalary !== null ? dto.expectedSalary : null,
                        portalUrl: dto.portalUrl || null,
                        applicationNotes: dto.applicationNotes || null,
                        selectedCvId: dto.selectedCvId || null,
                        appliedAt: dto.applicationStatus === client_1.ApplicationStatus.APPLIED ? new Date() : null,
                    },
                },
            },
            include: {
                company: true,
                recruiter: true,
                application: true,
            },
        });
        return job;
    }
    async getJobs(userId, filter) {
        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 20;
        const skip = (page - 1) * limit;
        const where = {
            userId,
            isArchived: filter.tab === 'archived',
        };
        if (filter.tab === 'applied') {
            where.application = {
                status: {
                    in: [
                        client_1.ApplicationStatus.APPLIED,
                        client_1.ApplicationStatus.PHONE_SCREEN,
                        client_1.ApplicationStatus.TECHNICAL_ASSESSMENT,
                        client_1.ApplicationStatus.FIRST_ROUND_INTERVIEW,
                        client_1.ApplicationStatus.FINAL_ROUND_INTERVIEW,
                    ],
                },
            };
        }
        else if (filter.tab === 'interviews') {
            where.application = {
                status: {
                    in: [
                        client_1.ApplicationStatus.PHONE_SCREEN,
                        client_1.ApplicationStatus.TECHNICAL_ASSESSMENT,
                        client_1.ApplicationStatus.FIRST_ROUND_INTERVIEW,
                        client_1.ApplicationStatus.FINAL_ROUND_INTERVIEW,
                    ],
                },
            };
        }
        else if (filter.tab === 'expiring') {
            const now = new Date();
            const next7Days = new Date();
            next7Days.setDate(now.getDate() + 7);
            where.deadline = {
                gte: now,
                lte: next7Days,
            };
        }
        if (filter.search) {
            where.OR = [
                { title: { contains: filter.search, mode: 'insensitive' } },
                { description: { contains: filter.search, mode: 'insensitive' } },
                { company: { name: { contains: filter.search, mode: 'insensitive' } } },
                { requiredSkills: { hasSome: [filter.search] } },
            ];
        }
        if (filter.workMode) {
            where.workMode = filter.workMode;
        }
        if (filter.jobType) {
            where.jobType = filter.jobType;
        }
        if (filter.minSalary) {
            where.minSalary = { gte: Number(filter.minSalary) };
        }
        if (filter.maxSalary) {
            where.maxSalary = { lte: Number(filter.maxSalary) };
        }
        let orderBy = { createdAt: 'desc' };
        if (filter.sortBy === 'deadline') {
            orderBy = { deadline: filter.sortOrder || 'asc' };
        }
        else if (filter.sortBy === 'salary') {
            orderBy = { maxSalary: filter.sortOrder || 'desc' };
        }
        const [total, jobs] = await Promise.all([
            this.prisma.job.count({ where }),
            this.prisma.job.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    company: true,
                    recruiter: true,
                    application: true,
                    matchResults: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            }),
        ]);
        return {
            jobs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getJobById(userId, jobId) {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, userId },
            include: {
                company: true,
                recruiter: true,
                application: {
                    include: {
                        selectedCv: { select: { id: true, title: true } },
                        emails: true,
                        followUps: true,
                        statusHistory: { orderBy: { changedAt: 'desc' } },
                    },
                },
                matchResults: {
                    include: { cv: { select: { id: true, title: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                notes: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        return job;
    }
    async updateJob(userId, jobId, data) {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, userId },
            include: { application: true, company: true, recruiter: true },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        let companyId = job.companyId;
        if (data.companyName && data.companyName.trim() && (!job.company || job.company.name !== data.companyName.trim())) {
            const cName = data.companyName.trim();
            let company = await this.prisma.company.findFirst({
                where: { userId, name: { equals: cName, mode: 'insensitive' } },
            });
            if (!company) {
                company = await this.prisma.company.create({
                    data: { userId, name: cName },
                });
            }
            companyId = company.id;
        }
        let recruiterId = job.recruiterId;
        if (data.recruiterName || data.recruiterEmail) {
            const rName = data.recruiterName?.trim();
            const rEmail = data.recruiterEmail?.trim()?.toLowerCase();
            let recruiter = null;
            if (rEmail) {
                recruiter = await this.prisma.recruiter.findFirst({
                    where: { userId, email: rEmail },
                });
            }
            if (!recruiter && rName) {
                recruiter = await this.prisma.recruiter.findFirst({
                    where: { userId, name: rName },
                });
            }
            if (!recruiter) {
                recruiter = await this.prisma.recruiter.create({
                    data: {
                        userId,
                        companyId: companyId || undefined,
                        name: rName || 'Hiring Team',
                        email: rEmail,
                        role: 'HR / Recruitment',
                    },
                });
            }
            else if (rEmail && !recruiter.email) {
                recruiter = await this.prisma.recruiter.update({
                    where: { id: recruiter.id },
                    data: { email: rEmail },
                });
            }
            recruiterId = recruiter?.id || null;
        }
        const updated = await this.prisma.job.update({
            where: { id: jobId },
            data: {
                companyId,
                recruiterId,
                title: data.title !== undefined ? data.title : undefined,
                location: data.location !== undefined ? data.location : undefined,
                country: data.country !== undefined ? data.country : undefined,
                workMode: data.workMode !== undefined ? data.workMode : undefined,
                jobType: data.jobType !== undefined ? data.jobType : undefined,
                experienceRequired: data.experienceRequired !== undefined ? data.experienceRequired : undefined,
                minSalary: data.minSalary !== undefined ? data.minSalary : undefined,
                maxSalary: data.maxSalary !== undefined ? data.maxSalary : undefined,
                salaryCurrency: data.salaryCurrency !== undefined ? data.salaryCurrency : undefined,
                salaryPeriod: data.salaryPeriod !== undefined ? data.salaryPeriod : undefined,
                description: data.description !== undefined ? data.description : undefined,
                responsibilities: data.responsibilities !== undefined ? data.responsibilities : undefined,
                requirements: data.requirements !== undefined ? data.requirements : undefined,
                requiredSkills: data.requiredSkills !== undefined ? data.requiredSkills : undefined,
                preferredSkills: data.preferredSkills !== undefined ? data.preferredSkills : undefined,
                benefits: data.benefits !== undefined ? data.benefits : undefined,
                deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : undefined,
            },
        });
        if (data.expectedSalary !== undefined ||
            data.applicationStatus !== undefined ||
            data.applicationNotes !== undefined ||
            data.portalUrl !== undefined ||
            data.selectedCvId !== undefined ||
            data.expectedSalaryCurrency !== undefined) {
            await this.prisma.application.upsert({
                where: { jobId },
                create: {
                    jobId,
                    status: data.applicationStatus || client_1.ApplicationStatus.SAVED,
                    expectedSalary: data.expectedSalary !== undefined ? data.expectedSalary : null,
                    salaryCurrency: data.expectedSalaryCurrency || data.salaryCurrency || 'USD',
                    applicationNotes: data.applicationNotes || null,
                    portalUrl: data.portalUrl || null,
                    selectedCvId: data.selectedCvId || null,
                    appliedAt: data.applicationStatus === client_1.ApplicationStatus.APPLIED ? new Date() : null,
                },
                update: {
                    status: data.applicationStatus || undefined,
                    expectedSalary: data.expectedSalary !== undefined ? data.expectedSalary : undefined,
                    salaryCurrency: data.expectedSalaryCurrency || data.salaryCurrency || undefined,
                    applicationNotes: data.applicationNotes !== undefined ? data.applicationNotes : undefined,
                    portalUrl: data.portalUrl !== undefined ? data.portalUrl : undefined,
                    selectedCvId: data.selectedCvId !== undefined ? data.selectedCvId : undefined,
                    appliedAt: data.applicationStatus === client_1.ApplicationStatus.APPLIED && !job.application?.appliedAt
                        ? new Date()
                        : undefined,
                },
            });
        }
        return this.getJobById(userId, jobId);
    }
    async toggleArchive(userId, jobId) {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, userId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        const updated = await this.prisma.job.update({
            where: { id: jobId },
            data: { isArchived: !job.isArchived },
        });
        return {
            message: updated.isArchived ? 'Job archived' : 'Job unarchived',
            isArchived: updated.isArchived,
        };
    }
    async deleteJob(userId, jobId) {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, userId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        await this.prisma.job.delete({
            where: { id: jobId },
        });
        return { message: 'Job deleted successfully' };
    }
    async scrapeJobUrl(url) {
        if (url.includes('docs.google.com/document/d/')) {
            const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
            if (match) {
                const docId = match[1];
                const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
                try {
                    const res = await axios_1.default.get(exportUrl, { timeout: 10000 });
                    return { text: String(res.data).trim(), platform: client_1.JobSource.SCRAPED };
                }
                catch (docErr) {
                    this.logger.warn(`Failed to export Google doc as txt, falling back to standard scrape`, docErr);
                }
            }
        }
        const response = await axios_1.default.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            timeout: 10000,
        });
        const html = response.data;
        const $ = cheerio.load(html);
        $('script, style, nav, footer, header, noscript, svg, iframe, .cookie-banner, .advertisement').remove();
        let platform = client_1.JobSource.SCRAPED;
        if (url.includes('linkedin.com'))
            platform = client_1.JobSource.LINKEDIN;
        else if (url.includes('indeed.com'))
            platform = client_1.JobSource.INDEED;
        else if (url.includes('glassdoor.com'))
            platform = client_1.JobSource.GLASSDOOR;
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        return { text, platform };
    }
    generateContentHash(content) {
        const normalized = content.toLowerCase().replace(/[^a-z0-9]/g, '');
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gemini_service_1.GeminiService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map