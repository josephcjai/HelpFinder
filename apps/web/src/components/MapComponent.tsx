import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix for default marker icons in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png'
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png'
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface Task {
    id: string
    title: string
    latitude?: number
    longitude?: number
    budgetMin?: number
    budgetMax?: number
}

interface MapComponentProps {
    tasks?: Task[]
    onLocationSelect?: (lat: number, lng: number) => void
    selectedLocation?: { lat: number; lng: number } | null
    center?: [number, number]
    zoom?: number
    searchRadius?: number // in km
}

function LocationMarker({ onSelect, position }: { onSelect?: (lat: number, lng: number) => void, position?: { lat: number; lng: number } | null }) {
    const map = useMapEvents({
        click(e) {
            if (onSelect) {
                onSelect(e.latlng.lat, e.latlng.lng)
                map.flyTo(e.latlng, map.getZoom())
            }
        },
    })

    return position ? <Marker position={[position.lat, position.lng]} /> : null
}

export default function MapComponent({ tasks = [], onLocationSelect, selectedLocation, center = [51.505, -0.09], zoom = 13, searchRadius }: MapComponentProps) {
    return (
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '1rem' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render Task Markers */}
            {tasks.map(task => (
                task.latitude && task.longitude && (
                    <Marker key={task.id} position={[task.latitude, task.longitude]}>
                        <Popup>
                            <strong>{task.title}</strong> <br />
                            ${task.budgetMin} - ${task.budgetMax}
                        </Popup>
                    </Marker>
                )
            ))}

            {/* Render Search Radius */}
            {selectedLocation && searchRadius && (
                <Circle
                    center={[selectedLocation.lat, selectedLocation.lng]}
                    radius={searchRadius * 1000} // Convert km to meters
                    pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                />
            )}

            {/* Handle Location Selection */}
            <LocationMarker onSelect={onLocationSelect} position={selectedLocation} />
        </MapContainer>
    )
}
