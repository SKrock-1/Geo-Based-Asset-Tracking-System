import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon path issues
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapComponent = ({ assets, selectedAssetHistory, onAssetClick }) => {
    // Memoize markers to prevent unnecessary re-renders of the entire map content
    const markers = useMemo(() => assets.map((asset) => (
        <Marker
            key={asset._id}
            position={[asset.location.coordinates[1], asset.location.coordinates[0]]} // GeoJSON is [lng, lat], Leaflet is [lat, lng]
            eventHandlers={{
                click: () => onAssetClick && onAssetClick(asset._id)
            }}
        >
            <Popup>
                <div className="p-2 min-w-[180px]">
                    <h3 className="font-bold text-gray-800 text-base mb-1">{asset.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{asset.description || 'No description available.'}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400">Status</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${asset.status === 'active'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-red-100 text-red-600'
                            }`}>
                            {asset.status.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-xs text-blue-500 mt-2 cursor-pointer hover:underline">Click to view history</p>
                </div>
            </Popup>
        </Marker>
    )), [assets, onAssetClick]);

    // Generate polyline points from history (oldest to newest for line drawing)
    const historyPolyline = useMemo(() => {
        if (!selectedAssetHistory || selectedAssetHistory.length === 0) return null;

        // History should be sorted oldest first for natural line drawing
        const sortedHistory = [...selectedAssetHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const positions = sortedHistory.map(h => [h.location.coordinates[1], h.location.coordinates[0]]);

        return (
            <>
                <Polyline
                    positions={positions}
                    pathOptions={{
                        color: '#3b82f6',
                        weight: 3,
                        opacity: 0.8,
                        dashArray: '10, 5'
                    }}
                />
                {sortedHistory.map((h, index) => (
                    <CircleMarker
                        key={index}
                        center={[h.location.coordinates[1], h.location.coordinates[0]]}
                        radius={6}
                        pathOptions={{
                            fillColor: '#3b82f6',
                            fillOpacity: 0.8,
                            color: '#1e40af',
                            weight: 2
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                            <div className="text-xs">
                                <strong>Point {index + 1}</strong><br />
                                {new Date(h.timestamp).toLocaleString()}
                            </div>
                        </Tooltip>
                    </CircleMarker>
                ))}
            </>
        );
    }, [selectedAssetHistory]);

    return (
        <MapContainer
            center={[20.5937, 78.9629]} // Default to India center
            zoom={5}
            scrollWheelZoom={true}
            className="h-full w-full rounded-2xl shadow-inner border border-slate-700 z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme tiles
            />
            {markers}
            {historyPolyline}
        </MapContainer>
    );
};

export default MapComponent;
