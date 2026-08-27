import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class ExtractJobDto {
  @IsString()
  @IsOptional()
  rawText?: string;

  @IsUrl({}, { message: 'Please provide a valid URL' })
  @IsOptional()
  url?: string;
}

export class FilterJobsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  recommendation?: string;

  @IsString()
  @IsOptional()
  workMode?: string;

  @IsString()
  @IsOptional()
  jobType?: string;

  @IsOptional()
  minSalary?: number;

  @IsOptional()
  maxSalary?: number;

  @IsOptional()
  minMatchScore?: number;

  @IsString()
  @IsOptional()
  tab?: 'all' | 'high-match' | 'applied' | 'interviews' | 'expiring' | 'archived';

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'deadline' | 'matchScore' | 'salary';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
