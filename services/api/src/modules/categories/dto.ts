import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, IsOptional } from 'class-validator'

export class CreateCategoryDto {
    @ApiProperty()
    @IsString()
    @MaxLength(50)
    name!: string

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    icon?: string

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    color?: string
}

export class UpdateCategoryDto {
    @ApiProperty()
    @IsString()
    @MaxLength(50)
    name!: string

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    icon?: string

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    color?: string
}
