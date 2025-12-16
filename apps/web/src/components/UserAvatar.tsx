import { UserProfile } from '@helpfinder/shared'
import { getCategoryColorClasses } from '../utils/colors'

interface UserAvatarProps {
    user?: Partial<UserProfile> | null
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

export const UserAvatar = ({ user, size = 'md', className = '' }: UserAvatarProps) => {
    const name = user?.name || 'Unknown'
    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    }

    const iconSizes = {
        sm: 'text-[18px]',
        md: 'text-[24px]',
        lg: 'text-[32px]',
        xl: 'text-[48px]'
    }

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-lg',
        xl: 'text-2xl'
    }

    const colorClass = user?.avatarColor
        ? getCategoryColorClasses(user.avatarColor)
        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'

    return (
        <div
            className={`
                rounded-full flex items-center justify-center font-bold uppercase flex-shrink-0
                ${sizeClasses[size]} 
                ${colorClass}
                ${className}
            `}
            title={name}
        >
            {user?.avatarIcon ? (
                <span className={`material-icons-round ${iconSizes[size]}`}>
                    {user.avatarIcon}
                </span>
            ) : (
                <span className={textSizeClasses[size]}>{user?.avatarInitials || (user?.name ? user.name.slice(0, 2) : '??')}</span>
            )}
        </div>
    )
}
