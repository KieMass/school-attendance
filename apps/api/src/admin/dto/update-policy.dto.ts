import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdatePolicyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(5)
  qrTokenValidityMinutes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  lateReturnGraceMinutes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requireDualApproval?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowWeekendLeaveOnly?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAdvanceRequestDays?: number;
}
