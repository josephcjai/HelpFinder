
export interface GeocodeResult {
    lat: number
    lon: number
    display_name: string
}

export const geocodeAddress = async (query: string): Promise<GeocodeResult | null> => {
    if (!query) return null
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data && data[0]) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name
            }
        }
        return null
    } catch (error) {
        console.error('Geocoding error:', error)
        return null
    }
}
