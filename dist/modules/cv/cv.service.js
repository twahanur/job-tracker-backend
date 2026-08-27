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
var CvService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const mammoth = require("mammoth");
const pdfParse = require('pdf-parse');
const prisma_service_1 = require("../../prisma/prisma.service");
const gemini_service_1 = require("../ai/gemini.service");
let CvService = CvService_1 = class CvService {
    prisma;
    geminiService;
    logger = new common_1.Logger(CvService_1.name);
    constructor(prisma, geminiService) {
        this.prisma = prisma;
        this.geminiService = geminiService;
    }
    async uploadAndParseCv(userId, file, dto) {
        if (!file) {
            throw new common_1.BadRequestException('No CV file uploaded');
        }
        const mimeType = file.mimetype;
        let rawText = '';
        try {
            if (mimeType === 'application/pdf' || file.originalname.endsWith('.pdf')) {
                const pdfBuffer = file.buffer || fs.readFileSync(file.path);
                const pdfFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default || require('pdf-parse');
                const parsed = await pdfFn(pdfBuffer);
                rawText = parsed.text;
            }
            else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.originalname.endsWith('.docx')) {
                const docxBuffer = file.buffer || fs.readFileSync(file.path);
                const parsed = await mammoth.extractRawText({ buffer: docxBuffer });
                rawText = parsed.value;
            }
            else if (mimeType === 'text/plain') {
                rawText = (file.buffer || fs.readFileSync(file.path)).toString('utf-8');
            }
            else {
                throw new common_1.BadRequestException('Unsupported file format. Please upload PDF, DOCX, or TXT.');
            }
        }
        catch (err) {
            this.logger.error(`Failed to extract text from file ${file.originalname}`, err);
            throw new common_1.BadRequestException(`Failed to read file content: ${err.message}`);
        }
        if (!rawText.trim()) {
            throw new common_1.BadRequestException('Extracted text from CV is empty');
        }
        this.logger.log(`Extracting structured resume profile for user ${userId} via Gemini Flash...`);
        const parsedData = await this.geminiService.parseCvDocument(rawText);
        const existingCvCount = await this.prisma.cV.count({ where: { userId } });
        const isPrimary = existingCvCount === 0;
        const fileUrl = file.filename ? `/uploads/${file.filename}` : `/uploads/${file.originalname}`;
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
                        parsedData: parsedData,
                        summary: parsedData.summary || dto.summary || null,
                    },
                },
            },
            include: {
                versions: true,
            },
        });
        if (isPrimary) {
            await this.syncToProfile(userId, parsedData);
        }
        return cv;
    }
    async uploadNewVersion(userId, cvId, file) {
        const cv = await this.prisma.cV.findFirst({
            where: { id: cvId, userId },
            include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
        });
        if (!cv) {
            throw new common_1.NotFoundException('CV not found');
        }
        let rawText = '';
        const mimeType = file.mimetype;
        if (mimeType === 'application/pdf' || file.originalname.endsWith('.pdf')) {
            const pdfBuffer = file.buffer || fs.readFileSync(file.path);
            const pdfFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default || require('pdf-parse');
            const parsed = await pdfFn(pdfBuffer);
            rawText = parsed.text;
        }
        else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.originalname.endsWith('.docx')) {
            const docxBuffer = file.buffer || fs.readFileSync(file.path);
            const parsed = await mammoth.extractRawText({ buffer: docxBuffer });
            rawText = parsed.value;
        }
        else {
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
                parsedData: parsedData,
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
    async getUserCvs(userId) {
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
    async getCvById(userId, cvId) {
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
            throw new common_1.NotFoundException('CV not found');
        }
        return cv;
    }
    async setPrimaryCv(userId, cvId) {
        const cv = await this.prisma.cV.findFirst({
            where: { id: cvId, userId },
            include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
        });
        if (!cv) {
            throw new common_1.NotFoundException('CV not found');
        }
        await this.prisma.cV.updateMany({
            where: { userId, isPrimary: true },
            data: { isPrimary: false },
        });
        const updated = await this.prisma.cV.update({
            where: { id: cvId },
            data: { isPrimary: true },
            include: { versions: true },
        });
        if (cv.versions.length > 0 && cv.versions[0].parsedData) {
            await this.syncToProfile(userId, cv.versions[0].parsedData);
        }
        return updated;
    }
    async updateParsedData(userId, cvId, dto) {
        const cv = await this.prisma.cV.findFirst({
            where: { id: cvId, userId },
            include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
        });
        if (!cv) {
            throw new common_1.NotFoundException('CV not found');
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
    async deleteCv(userId, cvId) {
        const cv = await this.prisma.cV.findFirst({
            where: { id: cvId, userId },
        });
        if (!cv) {
            throw new common_1.NotFoundException('CV not found');
        }
        await this.prisma.cV.delete({
            where: { id: cvId },
        });
        return { message: 'CV deleted successfully' };
    }
    async syncToProfile(userId, parsedData) {
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
        }
        catch (e) {
            this.logger.warn(`Failed to sync CV data to candidate profile: ${e}`);
        }
    }
};
exports.CvService = CvService;
exports.CvService = CvService = CvService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gemini_service_1.GeminiService])
], CvService);
//# sourceMappingURL=cv.service.js.map