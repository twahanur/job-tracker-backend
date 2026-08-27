import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import {
  UpdateApplicationStatusDto,
  UpdateApplicationDetailsDto,
  GenerateEmailDto,
  UpdateEmailDraftDto,
  CreateFollowUpDto,
} from './dto/update-status.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('applications')
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Get()
  async getApplications(@CurrentUser('id') userId: string) {
    const apps = await this.applicationsService.getApplications(userId);
    return {
      message: 'Applications fetched',
      data: apps,
    };
  }

  @Get(':id')
  async getApplicationById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const app = await this.applicationsService.getApplicationById(userId, id);
    return {
      message: 'Application details fetched',
      data: app,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    const updated = await this.applicationsService.updateStatus(userId, id, dto);
    return {
      message: 'Application stage updated successfully',
      data: updated,
    };
  }

  @Patch(':id')
  async updateDetails(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDetailsDto,
  ) {
    const updated = await this.applicationsService.updateDetails(userId, id, dto);
    return {
      message: 'Application details updated',
      data: updated,
    };
  }

  @Post(':id/emails/generate')
  async generateEmail(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: GenerateEmailDto,
  ) {
    const draft = await this.applicationsService.generateEmailDraft(userId, id, dto);
    return {
      message: 'AI email draft generated successfully via Gemini Flash',
      data: draft,
    };
  }

  @Patch('emails/:emailId')
  async updateEmailDraft(
    @CurrentUser('id') userId: string,
    @Param('emailId') emailId: string,
    @Body() dto: UpdateEmailDraftDto,
  ) {
    const updated = await this.applicationsService.updateEmailDraft(userId, emailId, dto);
    return {
      message: 'Email draft updated',
      data: updated,
    };
  }

  @Post(':id/follow-ups')
  async scheduleFollowUp(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateFollowUpDto,
  ) {
    const reminder = await this.applicationsService.scheduleFollowUp(userId, id, dto);
    return {
      message: 'Follow-up scheduled',
      data: reminder,
    };
  }

  @Patch('follow-ups/:followUpId/complete')
  async completeFollowUp(
    @CurrentUser('id') userId: string,
    @Param('followUpId') followUpId: string,
  ) {
    const completed = await this.applicationsService.completeFollowUp(userId, followUpId);
    return {
      message: 'Follow-up marked as completed',
      data: completed,
    };
  }
}
