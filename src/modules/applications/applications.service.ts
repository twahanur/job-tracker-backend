import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService, ExtractedCvData, ExtractedJobData } from '../ai/gemini.service';
import {
  UpdateApplicationStatusDto,
  UpdateApplicationDetailsDto,
  GenerateEmailDto,
  UpdateEmailDraftDto,
  CreateFollowUpDto,
} from './dto/update-status.dto';
import { ApplicationStatus, EmailStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Get all applications for the Kanban board with associated Job, Company, and Match results
   */
  async getApplications(userId: string) {
    return this.prisma.application.findMany({
      where: {
        job: { userId, isArchived: false },
      },
      include: {
        job: {
          include: {
            company: true,
            recruiter: true,
            matchResults: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        selectedCv: { select: { id: true, title: true } },
        followUps: {
          where: { isCompleted: false },
          orderBy: { scheduledDate: 'asc' },
        },
        emails: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get single application details with full status history and drafts
   */
  async getApplicationById(userId: string, applicationId: string) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { userId },
      },
      include: {
        job: {
          include: {
            company: true,
            recruiter: true,
            matchResults: {
              include: { cv: { select: { id: true, title: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        selectedCv: true,
        statusHistory: { orderBy: { changedAt: 'desc' } },
        emails: { orderBy: { createdAt: 'desc' } },
        followUps: { orderBy: { scheduledDate: 'asc' } },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  /**
   * Update Kanban stage and log status transition history
   */
  async updateStatus(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { userId },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const previousStatus = application.status;
    const isApplyingNow =
      dto.status === ApplicationStatus.APPLIED && !application.appliedAt;

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        appliedAt: isApplyingNow
          ? dto.appliedAt
            ? new Date(dto.appliedAt)
            : new Date()
          : application.appliedAt,
        statusHistory: {
          create: {
            previousStatus,
            newStatus: dto.status,
            notes: dto.notes || null,
          },
        },
      },
      include: {
        job: {
          include: { company: true },
        },
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
    });

    return updated;
  }

  /**
   * Update application expected salary, portal URL, or notes
   */
  async updateDetails(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationDetailsDto,
  ) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { userId },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: {
        selectedCvId: dto.selectedCvId,
        expectedSalary: dto.expectedSalary,
        salaryCurrency: dto.salaryCurrency,
        portalUrl: dto.portalUrl,
        applicationNotes: dto.applicationNotes,
      },
      include: {
        selectedCv: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Generate an AI cold outreach or follow-up email draft using Google Gemini Flash
   */
  async generateEmailDraft(
    userId: string,
    applicationId: string,
    dto: GenerateEmailDto,
  ) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { userId },
      },
      include: {
        job: { include: { company: true, recruiter: true } },
        selectedCv: {
          include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Retrieve CV (or user's primary CV)
    let cv = application.selectedCv;
    if (!cv) {
      cv = await this.prisma.cV.findFirst({
        where: { userId, isPrimary: true },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      });
      if (!cv) {
        cv = await this.prisma.cV.findFirst({
          where: { userId },
          include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    if (!cv || cv.versions.length === 0) {
      throw new BadRequestException('Please upload a CV to generate personalized emails.');
    }

    const structuredCv = cv.versions[0].parsedData as unknown as ExtractedCvData;
    const structuredJob: ExtractedJobData = {
      title: application.job.title,
      companyName: application.job.company?.name || 'Company',
      location: application.job.location || undefined,
      workMode: application.job.workMode,
      jobType: application.job.jobType,
      salaryCurrency: application.job.salaryCurrency,
      salaryPeriod: application.job.salaryPeriod as any,
      description: application.job.description,
      responsibilities: application.job.responsibilities,
      requirements: application.job.requirements,
      requiredSkills: application.job.requiredSkills,
      preferredSkills: application.job.preferredSkills,
      benefits: application.job.benefits,
    };

    const recipientEmail =
      dto.recipientEmail?.trim() || application.job.recruiter?.email || null;
    const recruiterName =
      dto.recruiterName?.trim() || application.job.recruiter?.name || undefined;

    this.logger.log(`Generating ${dto.type} email draft (${dto.tone || 'PROFESSIONAL'}) via Gemini Flash for recipient: ${recipientEmail || 'N/A'}...`);
    const draft = await this.geminiService.generateEmailDraft({
      type: dto.type,
      job: structuredJob,
      cv: structuredCv,
      recruiterName,
      tone: dto.tone,
      customInstructions: dto.customInstructions || dto.customNotes,
      customNotes: dto.customNotes,
    });

    // Save Email draft
    const savedDraft = await this.prisma.emailDraft.create({
      data: {
        applicationId,
        type: dto.type,
        recipientName: recruiterName || null,
        recipientEmail,
        subject: draft.subject,
        bodyMarkdown: draft.bodyMarkdown,
        status: EmailStatus.DRAFT,
      },
    });

    return savedDraft;
  }

  /**
   * Update email draft subject/body or mark as SENT
   */
  async updateEmailDraft(userId: string, emailId: string, dto: UpdateEmailDraftDto) {
    const draft = await this.prisma.emailDraft.findFirst({
      where: {
        id: emailId,
        application: { job: { userId } },
      },
    });

    if (!draft) {
      throw new NotFoundException('Email draft not found');
    }

    const isSending = dto.status === EmailStatus.SENT;

    const updated = await this.prisma.emailDraft.update({
      where: { id: emailId },
      data: {
        recipientName: dto.recipientName !== undefined ? dto.recipientName : draft.recipientName,
        recipientEmail: dto.recipientEmail !== undefined ? dto.recipientEmail : draft.recipientEmail,
        subject: dto.subject !== undefined ? dto.subject : draft.subject,
        bodyMarkdown: dto.bodyMarkdown !== undefined ? dto.bodyMarkdown : draft.bodyMarkdown,
        status: dto.status !== undefined ? dto.status : draft.status,
        sentAt: isSending ? (draft.sentAt || new Date()) : draft.sentAt,
      },
    });

    // Auto-update application status to APPLIED if sending for the first time
    if (isSending) {
      const app = await this.prisma.application.findUnique({
        where: { id: draft.applicationId },
      });
      if (
        app &&
        (app.status === ApplicationStatus.SAVED ||
          app.status === ApplicationStatus.DRAFTED ||
          app.status === ApplicationStatus.MATCHED)
      ) {
        await this.prisma.application.update({
          where: { id: draft.applicationId },
          data: {
            status: ApplicationStatus.APPLIED,
            appliedAt: new Date(),
          },
        });
      }
    }

    return updated;
  }

  /**
   * Schedule a follow-up reminder
   */
  async scheduleFollowUp(
    userId: string,
    applicationId: string,
    dto: CreateFollowUpDto,
  ) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { userId },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.followUpSchedule.create({
      data: {
        applicationId,
        scheduledDate: new Date(dto.scheduledDate),
        reminderTitle: dto.reminderTitle,
        notes: dto.notes || null,
      },
    });
  }

  /**
   * Mark follow-up as completed
   */
  async completeFollowUp(userId: string, followUpId: string) {
    const followUp = await this.prisma.followUpSchedule.findFirst({
      where: {
        id: followUpId,
        application: { job: { userId } },
      },
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up schedule not found');
    }

    return this.prisma.followUpSchedule.update({
      where: { id: followUpId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  }
}
