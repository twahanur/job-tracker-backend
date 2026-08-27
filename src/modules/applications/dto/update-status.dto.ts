import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { ApplicationStatus, EmailType, EmailStatus } from '@prisma/client';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus, { message: 'Invalid application status' })
  @IsNotEmpty()
  status: ApplicationStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  appliedAt?: string;
}

export class UpdateApplicationDetailsDto {
  @IsUUID('4')
  @IsOptional()
  selectedCvId?: string;

  @IsNumber()
  @IsOptional()
  expectedSalary?: number;

  @IsString()
  @IsOptional()
  salaryCurrency?: string;

  @IsString()
  @IsOptional()
  portalUrl?: string;

  @IsString()
  @IsOptional()
  applicationNotes?: string;
}

export class GenerateEmailDto {
  @IsEnum(EmailType)
  @IsNotEmpty()
  type: EmailType;

  @IsString()
  @IsOptional()
  recruiterName?: string;

  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @IsString()
  @IsOptional()
  tone?: string;

  @IsString()
  @IsOptional()
  customInstructions?: string;

  @IsString()
  @IsOptional()
  customNotes?: string;
}

export class UpdateEmailDraftDto {
  @IsString()
  @IsOptional()
  recipientName?: string;

  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  bodyMarkdown?: string;

  @IsEnum(EmailStatus)
  @IsOptional()
  status?: EmailStatus;
}

export class CreateFollowUpDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @IsString()
  @IsNotEmpty()
  reminderTitle: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
