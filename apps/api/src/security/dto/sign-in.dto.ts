import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({ description: 'The ExitLog id returned when the student left' })
  @IsString()
  @IsNotEmpty()
  exitLogId: string;

  @ApiProperty({ required: false, example: 'Main Gate' })
  @IsOptional()
  @IsString()
  gateLocation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
