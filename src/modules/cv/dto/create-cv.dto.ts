import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCvDto {
  @IsString()
  @IsNotEmpty({ message: 'CV title is required' })
  title: string;

  @IsString()
  @IsOptional()
  summary?: string;
}

export class UpdateParsedCvDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsOptional()
  parsedData?: any;
}
