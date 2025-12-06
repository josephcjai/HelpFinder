import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength } from 'class-validator'

export class CreateCategoryDto {
    @ApiProperty()
    @IsString()
    @MaxLength(50)
    name!: string
}

export class UpdateCategoryDto {
    @ApiProperty()
    @IsString()
    @MaxLength(50)
    name!: string
}
