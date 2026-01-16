import { IsString, IsInt, Min, Max, IsEnum, IsOptional, IsNotEmpty } from 'class-validator'

export class CreateReviewDto {
    @IsString()
    @IsNotEmpty()
    taskId!: string

    @IsString()
    @IsNotEmpty()
    targetUserId!: string

    @IsString()
    @IsNotEmpty()
    @IsEnum(['helper', 'requester'])
    targetRole!: 'helper' | 'requester'

    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number

    @IsString()
    @IsOptional()
    comment?: string
}
