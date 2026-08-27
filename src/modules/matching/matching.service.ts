import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService, ExtractedCvData, ExtractedJobData } from '../ai/gemini.service';
import { MatchJobDto } from './dto/match-job.dto';
import { ApplicationStatus, RecommendationTier } from '@prisma/client';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Evaluate match compatibility between a job and a candidate CV using Google Gemini Flash
   */
  async evaluateMatch(userId: string, jobId: string, dto: MatchJobDto) {
    // 1. Fetch Job details
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
      include: { company: true, application: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // 2. Fetch target CV (or primary CV)
    let cv: any = null;
    if (dto.cvId) {
      cv = await this.prisma.cV.findFirst({
        where: { id: dto.cvId, userId },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      });
    } else {
      cv = await this.prisma.cV.findFirst({
        where: { userId, isPrimary: true },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      });

      // Fallback to most recent CV if no primary is explicitly marked
      if (!cv) {
        cv = await this.prisma.cV.findFirst({
          where: { userId },
          include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    if (!cv || cv.versions.length === 0) {
      throw new BadRequestException(
        'No CV found in your vault. Please upload a CV first before running match evaluation.',
      );
    }

    const latestCvVersion = cv.versions[0];
    const structuredCv = latestCvVersion.parsedData as unknown as ExtractedCvData;

    const structuredJob: ExtractedJobData = {
      title: job.title,
      companyName: job.company?.name || 'Company',
      location: job.location || undefined,
      country: job.country || undefined,
      workMode: job.workMode,
      jobType: job.jobType,
      experienceRequired: job.experienceRequired || undefined,
      minSalary: job.minSalary ? Number(job.minSalary) : undefined,
      maxSalary: job.maxSalary ? Number(job.maxSalary) : undefined,
      salaryCurrency: job.salaryCurrency,
      salaryPeriod: job.salaryPeriod as any,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      benefits: job.benefits,
      deadline: job.deadline ? job.deadline.toISOString() : undefined,
    };

    // 3. Execute Gemini Flash Match Inference
    this.logger.log(`Evaluating match for Job ${job.title} vs CV ${cv.title} (v${latestCvVersion.versionNumber})...`);
    const matchAnalysis = await this.geminiService.evaluateJobMatch(
      structuredCv,
      structuredJob,
    );

    // Map recommendation string to Enum
    let recommendation: RecommendationTier = RecommendationTier.LOW_MATCH;
    if (matchAnalysis.overallScore >= 85) {
      recommendation = RecommendationTier.HIGHLY_RECOMMENDED;
    } else if (matchAnalysis.overallScore >= 70) {
      recommendation = RecommendationTier.RECOMMENDED;
    } else if (matchAnalysis.overallScore >= 50) {
      recommendation = RecommendationTier.MODERATE_MATCH;
    }

    // 4. Save match result in PostgreSQL
    const savedResult = await this.prisma.jobMatchResult.create({
      data: {
        jobId: job.id,
        cvId: cv.id,
        cvVersionNumber: latestCvVersion.versionNumber,
        overallScore: matchAnalysis.overallScore,
        recommendation,
        skillsScore: matchAnalysis.breakdown.skillsScore,
        experienceScore: matchAnalysis.breakdown.experienceScore,
        educationScore: matchAnalysis.breakdown.educationScore,
        locationScore: matchAnalysis.breakdown.locationScore,
        salaryScore: matchAnalysis.breakdown.salaryScore,
        matchedSkills: matchAnalysis.matchedSkills,
        missingSkills: matchAnalysis.missingSkills,
        partialSkills: matchAnalysis.partialSkills,
        strengths: matchAnalysis.strengths,
        gaps: matchAnalysis.gaps,
        actionableTips: matchAnalysis.actionableTips,
        explanation: matchAnalysis.explanation,
      },
      include: {
        cv: { select: { id: true, title: true, isPrimary: true } },
      },
    });

    // 5. If application is in SAVED status, automatically transition to MATCHED
    if (job.application && job.application.status === ApplicationStatus.SAVED) {
      await this.prisma.application.update({
        where: { id: job.application.id },
        data: {
          status: ApplicationStatus.MATCHED,
          selectedCvId: cv.id,
        },
      });
    }

    return savedResult;
  }

  /**
   * Get latest or all match results for a job
   */
  async getJobMatchResults(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.jobMatchResult.findMany({
      where: { jobId },
      include: {
        cv: { select: { id: true, title: true, isPrimary: true, currentVersion: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
