import { HttpException, HttpStatus } from '@nestjs/common';
import { UserEntity } from '../../entities/user.entity'; // Adjust path if needed

/**
 * Checks if a user has exceeded a daily rate limit.
 * Resets the counter if the day has changed.
 * Throws HttpException if limit is exceeded.
 */
export function checkRateLimit(
    user: UserEntity,
    countField: keyof UserEntity,
    dateField: keyof UserEntity,
    limit: number,
    errorMessage: string
): void {
    const now = new Date();
    const lastSent = user[dateField] as Date | null;

    const isSameDay = lastSent &&
        lastSent.getDate() === now.getDate() &&
        lastSent.getMonth() === now.getMonth() &&
        lastSent.getFullYear() === now.getFullYear();

    if (!isSameDay) {
        // Reset count for new day. We need to cast to any or number because TS doesn't know for sure it's a number field
        (user as any)[countField] = 0;
    }

    const currentCount = (user as any)[countField] as number;

    if (currentCount >= limit) {
        throw new HttpException(errorMessage, HttpStatus.TOO_MANY_REQUESTS);
    }
}

/**
 * Increments the rate limit counter and updates the timestamp.
 * Does NOT save to database; caller must save.
 */
export function incrementRateLimit(
    user: UserEntity,
    countField: keyof UserEntity,
    dateField: keyof UserEntity
): void {
    const now = new Date();
    (user as any)[countField] = ((user as any)[countField] || 0) + 1;
    (user as any)[dateField] = now;
}
