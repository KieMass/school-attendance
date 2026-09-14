import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty({ enum: LeaveType })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  destination: string;

  @ApiProperty({ description: 'ISO date, e.g. 2026-09-20' })
  @IsDateString()
  leaveDate: string;

  @ApiProperty({ description: 'ISO datetime of planned departure' })
  @IsDateString()
  departureTime: string;

  @ApiProperty({ description: 'ISO datetime the student must be back by' })
  @IsDateString()
  expectedReturnTime: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalNotes?: string;
}
