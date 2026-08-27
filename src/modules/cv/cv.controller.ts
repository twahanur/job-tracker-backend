import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { CvService } from './cv.service';
import { CreateCvDto, UpdateParsedCvDto } from './dto/create-cv.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller('cv')
export class CvController {
  constructor(private cvService: CvService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.pdf', '.docx', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF, DOCX, and TXT files are allowed'), false);
        }
      },
    }),
  )
  async uploadCv(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateCvDto,
  ) {
    const cv = await this.cvService.uploadAndParseCv(userId, file, dto);
    return {
      message: 'CV uploaded and structured profile parsed successfully via Gemini Flash',
      data: cv,
    };
  }

  @Post(':id/version')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `cv-version-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadNewVersion(
    @CurrentUser('id') userId: string,
    @Param('id') cvId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const updated = await this.cvService.uploadNewVersion(userId, cvId, file);
    return {
      message: 'New CV version uploaded and parsed successfully',
      data: updated,
    };
  }

  @Get()
  async getMyCvs(@CurrentUser('id') userId: string) {
    const cvs = await this.cvService.getUserCvs(userId);
    return {
      message: 'CV list fetched',
      data: cvs,
    };
  }

  @Get(':id')
  async getCvDetails(
    @CurrentUser('id') userId: string,
    @Param('id') cvId: string,
  ) {
    const cv = await this.cvService.getCvById(userId, cvId);
    return {
      message: 'CV details fetched',
      data: cv,
    };
  }

  @Patch(':id/primary')
  async setPrimary(
    @CurrentUser('id') userId: string,
    @Param('id') cvId: string,
  ) {
    const cv = await this.cvService.setPrimaryCv(userId, cvId);
    return {
      message: 'Primary CV updated successfully',
      data: cv,
    };
  }

  @Patch(':id')
  async updateParsedData(
    @CurrentUser('id') userId: string,
    @Param('id') cvId: string,
    @Body() dto: UpdateParsedCvDto,
  ) {
    const cv = await this.cvService.updateParsedData(userId, cvId, dto);
    return {
      message: 'CV details updated',
      data: cv,
    };
  }

  @Delete(':id')
  async deleteCv(
    @CurrentUser('id') userId: string,
    @Param('id') cvId: string,
  ) {
    const result = await this.cvService.deleteCv(userId, cvId);
    return result;
  }
}
