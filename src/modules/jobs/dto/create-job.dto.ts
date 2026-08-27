import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { WorkMode, JobType, JobSource } from '@prisma/client';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty({ message: 'Job title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  companyName: string;

  @IsUrl({}, { message: 'Invalid source URL' })
  @IsOptional()
  sourceUrl?: string;

  @IsEnum(JobSource)
  @IsOptional()
  sourcePlatform?: JobSource;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsEnum(WorkMode)
  @IsOptional()
  workMode?: WorkMode;

  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;

  @IsString()
  @IsOptional()
  experienceRequired?: string;

  @IsNumber()
  @IsOptional()
  minSalary?: number;

  @IsNumber()
  @IsOptional()
  maxSalary?: number;

  @IsString()
  @IsOptional()
  salaryCurrency?: string;

  @IsString()
  @IsOptional()
  salaryPeriod?: string;

  @IsString()
  @IsNotEmpty({ message: 'Job description is required' })
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibilities?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requirements?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredSkills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredSkills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsString()
  @IsOptional()
  recruiterName?: string;

  @IsString()
  @IsOptional()
  recruiterEmail?: string;

  // Application & Negotiation fields
  @IsNumber()
  @IsOptional()
  expectedSalary?: number;

  @IsString()
  @IsOptional()
  expectedSalaryCurrency?: string;

  @IsString()
  @IsOptional()
  applicationNotes?: string;

  @IsString()
  @IsOptional()
  portalUrl?: string;

  @IsString()
  @IsOptional()
  applicationStatus?: string;

  @IsString()
  @IsOptional()
  selectedCvId?: string;
}
