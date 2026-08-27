import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { WorkMode } from '@prisma/client';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetRoles?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredLocations?: string[];

  @IsArray()
  @IsEnum(WorkMode, { each: true })
  @IsOptional()
  workModePreferences?: WorkMode[];

  @IsNumber()
  @IsOptional()
  minExpectedSalary?: number;

  @IsNumber()
  @IsOptional()
  targetSalary?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  noticePeriodDays?: number;

  @IsUrl()
  @IsOptional()
  portfolioUrl?: string;

  @IsUrl()
  @IsOptional()
  linkedinUrl?: string;

  @IsUrl()
  @IsOptional()
  githubUrl?: string;
}
