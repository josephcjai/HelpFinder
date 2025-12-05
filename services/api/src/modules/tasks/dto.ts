import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  title!: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  zipCode?: string
}

