export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount)
    } catch (e) {
        // Fallback for invalid currency codes
        return `${amount} ${currency}`
    }
}
