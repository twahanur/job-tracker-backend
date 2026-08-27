import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
const pdfParse = require('pdf-parse');
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService, ExtractedCvData } from '../ai/gemini.service';
import { CreateCvDto, UpdateParsedCvDto } from './dto/create-cv.dto';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Upload CV file, extract raw text, parse structured data with Gemini Flash, and save
   */
  async uploadAndParseCv(
    userId: string,
    file: Express.Multer.File,
    dto: CreateCvDto,
  ) {
    if (!file) {
      throw new BadRequestException('No CV file uploaded');
    }

    const mimeType = file.mimetype;
    let rawText = '';

    try {
      if (mimeType === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        const pdfBuffer = file.buffer || fs.readFileSync(file.path);
        const pdfFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default || require('pdf-parse');
        const parsed = await pdfFn(pdfBuffer);
        rawText = parsed.text;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.endsWith('.docx')
      ) {
        const docxBuffer = file.buffer || fs.readFileSync(file.path);
        const parsed = await mammoth.extractRawText({ buffer: docxBuffer });
        rawText = parsed.value;
      } else if (mimeType === 'text/plain') {
        rawText = (file.buffer || fs.readFileSync(file.path)).toString('utf-8');
      } else {
        throw new BadRequestException(
          'Unsupported file format. Please upload PDF, DOCX, or TXT.',
        );
      }
    } catch (err: any) {
      this.logger.error(`Failed to extract text from file ${file.originalname}`, err);
      throw new BadRequestException(`Failed to read file content: ${err.message}`);
    }

    if (!rawText.trim()) {
      throw new BadRequestException('Extracted text from CV is empty');
    }

    // Parse structured resume data using Google Gemini Flash
    this.logger.log(`Extracting structured resume profile for user ${userId} via Gemini Flash...`);
    const parsedData = await this.geminiService.parseCvDocument(rawText);

    // Check if user has existing CVs to set isPrimary automatically if first
    const existingCvCount = await this.prisma.cV.count({ where: { userId } });
    const isPrimary = existingCvCount === 0;

    const fileUrl = file.filename ? `/uploads/${file.filename}` : `/uploads/${file.originalname}`;

    // Create CV and first CvVersion
    const cv = await this.prisma.cV.create({
      data: {
        userId,
        title: dto.title || file.originalname.replace(/\.[^/.]+$/, ''),
        isPrimary,
        currentVersion: 1,
        versions: {
          create: {
            versionNumber: 1,
            fileName: file.originalname,
            fileSize: file.size,
            fileUrl,
            mimeType,
            rawText,
            parsedData: parsedData as any,
            summary: parsedData.summary || dto.summary || null,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    // Automatically sync primary skills and headline to candidate profile if primary
    if (isPrimary) {
      await this.syncToProfile(userId, parsedData);
    }

    return cv;
  }

  /**
   * Upload a new version to an existing CV
   */
  async uploadNewVersion(
    userId: string,
    cvId: string,
    file: Express.Multer.File,
  ) {
    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, userId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    let rawText = '';
    const mimeType = file.mimetype;

    if (mimeType === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      const pdfBuffer = file.buffer || fs.readFileSync(file.path);
      const pdfFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default || require('pdf-parse');
      const parsed = await pdfFn(pdfBuffer);
      rawText = parsed.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.originalname.endsWith('.docx')
    ) {
      const docxBuffer = file.buffer || fs.readFileSync(file.path);
      const parsed = await mammoth.extractRawText({ buffer: docxBuffer });
      rawText = parsed.value;
    } else {
      rawText = (file.buffer || fs.readFileSync(file.path)).toString('utf-8');
    }

    const parsedData = await this.geminiService.parseCvDocument(rawText);
    const newVersionNumber = cv.currentVersion + 1;
    const fileUrl = file.filename ? `/uploads/${file.filename}` : `/uploads/${file.originalname}`;

    await this.prisma.cvVersion.create({
      data: {
        cvId: cv.id,
        versionNumber: newVersionNumber,
        fileName: file.originalname,
        fileSize: file.size,
        fileUrl,
        mimeType,
        rawText,
        parsedData: parsedData as any,
        summary: parsedData.summary || null,
      },
    });

    const updatedCv = await this.prisma.cV.update({
      where: { id: cv.id },
      data: { currentVersion: newVersionNumber },
      include: { versions: { orderBy: { versionNumber: 'desc' } } },
    });

    if (cv.isPrimary) {
      await this.syncToProfile(userId, parsedData);
    }

    return updatedCv;
  }

  /**
   * List all CVs for user
   */
  async getUserCvs(userId: string) {
    return this.prisma.cV.findMany({
      where: { userId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        _count: {
          select: { matchResults: true, applications: true },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get single CV details
   */
  async getCvById(userId: string, cvId: string) {
    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, userId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        matchResults: {
          include: { job: { select: { id: true, title: true, location: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    return cv;
  }

  /**
   * Set primary CV
   */
  async setPrimaryCv(userId: string, cvId: string) {
    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, userId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    // Unset all other primary CVs
    await this.prisma.cV.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set this CV as primary
    const updated = await this.prisma.cV.update({
      where: { id: cvId },
      data: { isPrimary: true },
      include: { versions: true },
    });

    if (cv.versions.length > 0 && cv.versions[0].parsedData) {
      await this.syncToProfile(userId, cv.versions[0].parsedData as unknown as ExtractedCvData);
    }

    return updated;
  }

  /**
   * Update parsed data manually
   */
  async updateParsedData(userId: string, cvId: string, dto: UpdateParsedCvDto) {
    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, userId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    const latestVersion = cv.versions[0];
    if (latestVersion && dto.parsedData) {
      await this.prisma.cvVersion.update({
        where: { id: latestVersion.id },
        data: {
          parsedData: dto.parsedData,
          summary: dto.parsedData.summary || latestVersion.summary,
        },
      });
    }

    if (dto.title) {
      await this.prisma.cV.update({
        where: { id: cvId },
        data: { title: dto.title },
      });
    }

    return this.getCvById(userId, cvId);
  }

  /**
   * Delete CV
   */
  async deleteCv(userId: string, cvId: string) {
    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    await this.prisma.cV.delete({
      where: { id: cvId },
    });

    return { message: 'CV deleted successfully' };
  }

  private async syncToProfile(userId: string, parsedData: ExtractedCvData) {
    try {
      const skills = [
        ...(parsedData.primarySkills || []),
        ...(parsedData.toolsAndFrameworks || []),
      ];

      await this.prisma.candidateProfile.upsert({
        where: { userId },
        update: {
          headline: parsedData.headline || undefined,
          skills: skills.length > 0 ? skills : undefined,
          portfolioUrl: parsedData.portfolioUrl || undefined,
          linkedinUrl: parsedData.linkedinUrl || undefined,
          githubUrl: parsedData.githubUrl || undefined,
        },
        create: {
          userId,
          headline: parsedData.headline || 'Candidate',
          skills,
          portfolioUrl: parsedData.portfolioUrl,
          linkedinUrl: parsedData.linkedinUrl,
          githubUrl: parsedData.githubUrl,
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to sync CV data to candidate profile: ${e}`);
    }
  }
}
