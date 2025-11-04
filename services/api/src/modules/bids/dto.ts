import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class CreateBidDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount!: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string
}

