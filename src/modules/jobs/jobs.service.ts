import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService, ExtractedJobData } from '../ai/gemini.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ExtractJobDto, FilterJobsDto } from './dto/extract-job.dto';
import { WorkMode, JobType, JobSource, ApplicationStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Scrape URL or parse Raw Text, run Gemini Flash extraction, and return structured preview
   */
  async extractJobPreview(userId: string, dto: ExtractJobDto) {
    let rawText = dto.rawText || '';
    let sourcePlatform: JobSource = JobSource.MANUAL;

    if (dto.url) {
      this.logger.log(`Scraping job URL: ${dto.url}`);
      try {
        const scraped = await this.scrapeJobUrl(dto.url);
        rawText = scraped.text;
        sourcePlatform = scraped.platform;
      } catch (err: any) {
        this.logger.error(`Failed to scrape URL: ${dto.url}`, err);
        throw new BadRequestException(`Could not scrape job from URL: ${err.message}`);
      }
    }

    if (!rawText.trim()) {
      throw new BadRequestException('Please provide either a valid job posting URL or paste the job description text');
    }

    // Compute SHA-256 content hash for duplicate check
    const contentHash = this.generateContentHash(rawText);

    // Check if user already added this exact job
    const existingJob = await this.prisma.job.findFirst({
      where: { userId, contentHash },
      include: { company: true, application: true },
    });

    // Extract structured details via Gemini Flash
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

  /**
   * Save extracted or manual job to database
   */
  async createJob(userId: string, dto: CreateJobDto & { rawContent?: string; contentHash?: string }) {
    // 1. Find or create Company record
    let companyId: string | null = null;
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

    // 2. Find or create Recruiter record if present
    let recruiterId: string | null = null;
    const rName = dto.recruiterName?.trim() || (dto.recruiterEmail ? `${dto.companyName?.trim() || 'Hiring'} Team` : null);
    const rEmail = dto.recruiterEmail?.trim() || null;

    if (rName || rEmail) {
      let recruiter: any = null;
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
      } else if (rEmail && !recruiter.email) {
        recruiter = await this.prisma.recruiter.update({
          where: { id: recruiter.id },
          data: { email: rEmail },
        });
      }

      recruiterId = recruiter?.id || null;
    }

    const contentHash = dto.contentHash || this.generateContentHash(dto.description);

    // 3. Create Job
    const job = await this.prisma.job.create({
      data: {
        userId,
        companyId,
        recruiterId,
        title: dto.title,
        sourceUrl: dto.sourceUrl || null,
        sourcePlatform: dto.sourcePlatform || JobSource.MANUAL,
        rawContent: dto.rawContent || dto.description,
        contentHash,
        location: dto.location || null,
        country: dto.country || null,
        workMode: dto.workMode || WorkMode.REMOTE,
        jobType: dto.jobType || JobType.FULL_TIME,
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
            status: (dto.applicationStatus as ApplicationStatus) || ApplicationStatus.SAVED,
            salaryCurrency: dto.expectedSalaryCurrency || dto.salaryCurrency || 'USD',
            expectedSalary: dto.expectedSalary !== undefined && dto.expectedSalary !== null ? dto.expectedSalary : null,
            portalUrl: dto.portalUrl || null,
            applicationNotes: dto.applicationNotes || null,
            selectedCvId: dto.selectedCvId || null,
            appliedAt: dto.applicationStatus === ApplicationStatus.APPLIED ? new Date() : null,
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

  /**
   * Filter and search jobs with pagination, tabs, and sorting
   */
  async getJobs(userId: string, filter: FilterJobsDto) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isArchived: filter.tab === 'archived',
    };

    // Tab-based filtering
    if (filter.tab === 'applied') {
      where.application = {
        status: {
          in: [
            ApplicationStatus.APPLIED,
            ApplicationStatus.PHONE_SCREEN,
            ApplicationStatus.TECHNICAL_ASSESSMENT,
            ApplicationStatus.FIRST_ROUND_INTERVIEW,
            ApplicationStatus.FINAL_ROUND_INTERVIEW,
          ],
        },
      };
    } else if (filter.tab === 'interviews') {
      where.application = {
        status: {
          in: [
            ApplicationStatus.PHONE_SCREEN,
            ApplicationStatus.TECHNICAL_ASSESSMENT,
            ApplicationStatus.FIRST_ROUND_INTERVIEW,
            ApplicationStatus.FINAL_ROUND_INTERVIEW,
          ],
        },
      };
    } else if (filter.tab === 'expiring') {
      const now = new Date();
      const next7Days = new Date();
      next7Days.setDate(now.getDate() + 7);
      where.deadline = {
        gte: now,
        lte: next7Days,
      };
    }

    // Keyword Search across title, description, company
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { company: { name: { contains: filter.search, mode: 'insensitive' } } },
        { requiredSkills: { hasSome: [filter.search] } },
      ];
    }

    // Work mode & Job type filters
    if (filter.workMode) {
      where.workMode = filter.workMode as WorkMode;
    }
    if (filter.jobType) {
      where.jobType = filter.jobType as JobType;
    }

    // Salary filters
    if (filter.minSalary) {
      where.minSalary = { gte: Number(filter.minSalary) };
    }
    if (filter.maxSalary) {
      where.maxSalary = { lte: Number(filter.maxSalary) };
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (filter.sortBy === 'deadline') {
      orderBy = { deadline: filter.sortOrder || 'asc' };
    } else if (filter.sortBy === 'salary') {
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

  /**
   * Get single job full details
   */
  async getJobById(userId: string, jobId: string) {
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
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  /**
   * Update Job metadata
   */
  async updateJob(userId: string, jobId: string, data: Partial<CreateJobDto>) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
      include: { application: true, company: true, recruiter: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
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
      let recruiter: any = null;
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
      } else if (rEmail && !recruiter.email) {
        recruiter = await this.prisma.recruiter.update({
          where: { id: recruiter.id },
          data: { email: rEmail },
        });
      }
      recruiterId = recruiter?.id || null;
    }

    // Update Job
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

    // Update or upsert linked Application if application-specific fields are provided
    if (
      data.expectedSalary !== undefined ||
      data.applicationStatus !== undefined ||
      data.applicationNotes !== undefined ||
      data.portalUrl !== undefined ||
      data.selectedCvId !== undefined ||
      data.expectedSalaryCurrency !== undefined
    ) {
      await this.prisma.application.upsert({
        where: { jobId },
        create: {
          jobId,
          status: (data.applicationStatus as ApplicationStatus) || ApplicationStatus.SAVED,
          expectedSalary: data.expectedSalary !== undefined ? data.expectedSalary : null,
          salaryCurrency: data.expectedSalaryCurrency || data.salaryCurrency || 'USD',
          applicationNotes: data.applicationNotes || null,
          portalUrl: data.portalUrl || null,
          selectedCvId: data.selectedCvId || null,
          appliedAt: data.applicationStatus === ApplicationStatus.APPLIED ? new Date() : null,
        },
        update: {
          status: (data.applicationStatus as ApplicationStatus) || undefined,
          expectedSalary: data.expectedSalary !== undefined ? data.expectedSalary : undefined,
          salaryCurrency: data.expectedSalaryCurrency || data.salaryCurrency || undefined,
          applicationNotes: data.applicationNotes !== undefined ? data.applicationNotes : undefined,
          portalUrl: data.portalUrl !== undefined ? data.portalUrl : undefined,
          selectedCvId: data.selectedCvId !== undefined ? data.selectedCvId : undefined,
          appliedAt:
            data.applicationStatus === ApplicationStatus.APPLIED && !job.application?.appliedAt
              ? new Date()
              : undefined,
        },
      });
    }

    return this.getJobById(userId, jobId);
  }

  /**
   * Archive or unarchive job
   */
  async toggleArchive(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
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

  /**
   * Delete job
   */
  async deleteJob(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.prisma.job.delete({
      where: { id: jobId },
    });

    return { message: 'Job deleted successfully' };
  }

  /**
   * Scrape and clean raw job description from web URL
   */
  private async scrapeJobUrl(url: string): Promise<{ text: string; platform: JobSource }> {
    // Handle public Google Docs link
    if (url.includes('docs.google.com/document/d/')) {
      const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const docId = match[1];
        const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
        try {
          const res = await axios.get(exportUrl, { timeout: 10000 });
          return { text: String(res.data).trim(), platform: JobSource.SCRAPED };
        } catch (docErr) {
          this.logger.warn(`Failed to export Google doc as txt, falling back to standard scrape`, docErr);
        }
      }
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Remove noisy elements (scripts, styles, navs, footers, cookie banners)
    $('script, style, nav, footer, header, noscript, svg, iframe, .cookie-banner, .advertisement').remove();

    let platform: JobSource = JobSource.SCRAPED;
    if (url.includes('linkedin.com')) platform = JobSource.LINKEDIN;
    else if (url.includes('indeed.com')) platform = JobSource.INDEED;
    else if (url.includes('glassdoor.com')) platform = JobSource.GLASSDOOR;

    // Extract main text
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return { text, platform };
  }

  private generateContentHash(content: string): string {
    const normalized = content.toLowerCase().replace(/[^a-z0-9]/g, '');
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
}
