import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ScanQrDto {
  @ApiProperty({ description: 'Raw string decoded from the scanned QR image' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false, example: 'Main Gate' })
  @IsOptional()
  @IsString()
  gateLocation?: string;
}
