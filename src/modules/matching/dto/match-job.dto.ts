import { IsOptional, IsUUID } from 'class-validator';

export class MatchJobDto {
  @IsUUID('4', { message: 'CV ID must be a valid UUID' })
  @IsOptional()
  cvId?: string;
}
