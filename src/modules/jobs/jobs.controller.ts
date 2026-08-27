import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { ExtractJobDto, FilterJobsDto } from './dto/extract-job.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post('extract')
  async extractJobPreview(
    @CurrentUser('id') userId: string,
    @Body() dto: ExtractJobDto,
  ) {
    const result = await this.jobsService.extractJobPreview(userId, dto);
    return {
      message: 'Job extracted successfully via Gemini Flash',
      data: result,
    };
  }

  @Post()
  async createJob(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJobDto & { rawContent?: string; contentHash?: string },
  ) {
    const job = await this.jobsService.createJob(userId, dto);
    return {
      message: 'Job created and added to tracking list',
      data: job,
    };
  }

  @Get()
  async getJobs(
    @CurrentUser('id') userId: string,
    @Query() query: FilterJobsDto,
  ) {
    const result = await this.jobsService.getJobs(userId, query);
    return {
      message: 'Jobs fetched',
      data: result,
    };
  }

  @Get(':id')
  async getJobDetails(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
  ) {
    const job = await this.jobsService.getJobById(userId, jobId);
    return {
      message: 'Job details fetched',
      data: job,
    };
  }

  @Patch(':id')
  async updateJob(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
    @Body() dto: Partial<CreateJobDto>,
  ) {
    const updated = await this.jobsService.updateJob(userId, jobId, dto);
    return {
      message: 'Job updated',
      data: updated,
    };
  }

  @Patch(':id/archive')
  async toggleArchive(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
  ) {
    const result = await this.jobsService.toggleArchive(userId, jobId);
    return result;
  }

  @Delete(':id')
  async deleteJob(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
  ) {
    const result = await this.jobsService.deleteJob(userId, jobId);
    return result;
  }
}
