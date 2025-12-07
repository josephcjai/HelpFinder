import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum } from 'class-validator'

export class CreateNotificationDto {
    @ApiProperty()
    @IsString()
    userId!: string

    @ApiProperty()
    @IsString()
    message!: string

    @ApiProperty({ required: false, enum: ['info', 'success', 'warning', 'error'] })
    @IsOptional()
    @IsEnum(['info', 'success', 'warning', 'error'])
    type?: 'info' | 'success' | 'warning' | 'error'

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    resourceId?: string
}
