import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateRecruiterDto,
  UpdateRecruiterDto,
} from './dto/crm.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('crm')
export class CrmController {
  constructor(private crmService: CrmService) {}

  // ================= COMPANIES =================

  @Get('companies')
  async getCompanies(@CurrentUser('id') userId: string) {
    const companies = await this.crmService.getCompanies(userId);
    return {
      message: 'Companies directory fetched',
      data: companies,
    };
  }

  @Get('companies/:id')
  async getCompanyById(
    @CurrentUser('id') userId: string,
    @Param('id') companyId: string,
  ) {
    const company = await this.crmService.getCompanyById(userId, companyId);
    return {
      message: 'Company profile fetched',
      data: company,
    };
  }

  @Post('companies')
  async createCompany(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCompanyDto,
  ) {
    const company = await this.crmService.createCompany(userId, dto);
    return {
      message: 'Company added to CRM',
      data: company,
    };
  }

  @Patch('companies/:id')
  async updateCompany(
    @CurrentUser('id') userId: string,
    @Param('id') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    const updated = await this.crmService.updateCompany(userId, companyId, dto);
    return {
      message: 'Company updated',
      data: updated,
    };
  }

  @Delete('companies/:id')
  async deleteCompany(
    @CurrentUser('id') userId: string,
    @Param('id') companyId: string,
  ) {
    await this.crmService.deleteCompany(userId, companyId);
    return {
      message: 'Company deleted from CRM',
    };
  }

  // ================= RECRUITERS =================

  @Get('recruiters')
  async getRecruiters(@CurrentUser('id') userId: string) {
    const recruiters = await this.crmService.getRecruiters(userId);
    return {
      message: 'Recruiter contacts fetched',
      data: recruiters,
    };
  }

  @Post('recruiters')
  async createRecruiter(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRecruiterDto,
  ) {
    const recruiter = await this.crmService.createRecruiter(userId, dto);
    return {
      message: 'Recruiter added to CRM',
      data: recruiter,
    };
  }

  @Patch('recruiters/:id')
  async updateRecruiter(
    @CurrentUser('id') userId: string,
    @Param('id') recruiterId: string,
    @Body() dto: UpdateRecruiterDto,
  ) {
    const updated = await this.crmService.updateRecruiter(userId, recruiterId, dto);
    return {
      message: 'Recruiter updated',
      data: updated,
    };
  }

  @Delete('recruiters/:id')
  async deleteRecruiter(
    @CurrentUser('id') userId: string,
    @Param('id') recruiterId: string,
  ) {
    await this.crmService.deleteRecruiter(userId, recruiterId);
    return {
      message: 'Recruiter deleted from CRM',
    };
  }
}
