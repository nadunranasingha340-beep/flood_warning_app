import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const RISK_COLOR = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const NO_DATA_COLOR = '#64748b';

export default function BasinMap({ stations = [], height = 'h-96' }) {
  const withCoords = useMemo(
    () => stations.filter((s) => s.latitude !== null && s.longitude !== null),
    [stations]
  );

  const center = useMemo(() => {
    if (!withCoords.length) return [7.59, 80.12];
    const lat = withCoords.reduce((sum, s) => sum + Number(s.latitude), 0) / withCoords.length;
    const lng = withCoords.reduce((sum, s) => sum + Number(s.longitude), 0) / withCoords.length;
    return [lat, lng];
  }, [withCoords]);

  if (!withCoords.length) {
    return (
      <div className={`${height} bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 border border-slate-800`}>
        <p>No station coordinates available for the map.</p>
      </div>
    );
  }

  return (
    <div className={`${height} rounded-xl overflow-hidden border border-slate-800`}>
      <MapContainer
        center={center}
        zoom={9}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {withCoords.map((station) => {
          const risk = station.forecast?.risk_level;
          const color = RISK_COLOR[risk] ?? NO_DATA_COLOR;
          const reading = station.latest_reading;
          return (
            <CircleMarker
              key={station.id}
              center={[Number(station.latitude), Number(station.longitude)]}
              radius={10}
              pathOptions={{
                color: '#0f172a',
                weight: 2,
                fillColor: color,
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="text-slate-900 text-sm">
                  <p className="font-bold text-base">{station.station_name}</p>
                  <p className="text-xs text-slate-600 font-mono">{station.station_code}</p>
                  <div className="mt-2 space-y-1">
                    <p>
                      <span className="text-slate-600">Elevation:</span>{' '}
                      <span className="font-semibold">{station.elevation} m</span>
                    </p>
                    <p>
                      <span className="text-slate-600">Warning threshold:</span>{' '}
                      <span className="font-semibold">{station.flood_threshold_m} m</span>
                    </p>
                    {reading ? (
                      <p>
                        <span className="text-slate-600">Last observed:</span>{' '}
                        <span className="font-semibold">{reading.water_level_m} m</span>{' '}
                        <span className="text-xs text-slate-500">({reading.date})</span>
                      </p>
                    ) : (
                      <p className="text-slate-500 italic">No readings recorded yet</p>
                    )}
                    {station.forecast ? (
                      <p>
                        <span className="text-slate-600">Forecast for {station.forecast.forecast_for}:</span>{' '}
                        <span className="font-semibold">
                          {station.forecast.predicted_water_level} m
                        </span>{' '}
                        <span
                          className="font-bold"
                          style={{ color: RISK_COLOR[station.forecast.risk_level] }}
                        >
                          ({station.forecast.risk_level})
                        </span>
                      </p>
                    ) : (
                      <p className="text-slate-500 italic">No forecast yet</p>
                    )}
                  </div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -8]}>
                {station.station_code}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
