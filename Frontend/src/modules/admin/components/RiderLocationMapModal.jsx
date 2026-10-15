import React, { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { MapPin, RefreshCw, X, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { env } from '../../../config/env';

// Same loader id/libraries as the other admin map screens: the Google loader
// refuses to be initialised twice with different options.
const libraries = ['places'];

const fmtDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const timeAgo = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const secs = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)} min ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)} hr ago`;
  return `${Math.round(secs / 86400)} days ago`;
};

/**
 * Shows a rider's reported position on a map with a pin. `status` is one of
 * 'waiting' | 'received' | 'timeout' | 'error' | 'idle'.
 */
export default function RiderLocationMapModal({ rental, location, status, notice, onRefresh, onClose }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: env.mapsKey,
    libraries,
  });

  const position = useMemo(
    () => (location && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng))
      ? { lat: Number(location.lat), lng: Number(location.lng) }
      : null),
    [location]
  );

  const waiting = status === 'waiting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={18} className="text-blue-600" /> Rider Live Location
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {rental?.id} · {rental?.user?.name} ({rental?.user?.phone}) · {rental?.scooty?.name} {rental?.scooty?.reg && rental.scooty.reg !== 'Unknown' ? `· ${rental.scooty.reg}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Status strip */}
        {waiting && (
          <div className="flex items-center gap-2 px-5 py-2.5 text-sm bg-blue-50 text-blue-800 border-b border-blue-100">
            <Loader2 size={16} className="animate-spin" />
            Waiting for the rider's phone to share its location…
            {position ? ' Showing the last known position meanwhile.' : ''}
          </div>
        )}
        {notice && (
          <div className={`flex items-start gap-2 px-5 py-2.5 text-sm border-b ${status === 'received' ? 'bg-green-50 text-green-800 border-green-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
            {status !== 'received' && <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
            <span>{notice}</span>
          </div>
        )}

        {/* Map */}
        <div className="h-[420px] bg-gray-100 relative">
          {!env.mapsKey || loadError ? (
            <div className="h-full flex flex-col items-center justify-center text-sm text-gray-500 gap-2 p-6 text-center">
              <AlertTriangle size={22} className="text-amber-500" />
              Map could not be loaded{!env.mapsKey ? ' (VITE_GOOGLE_MAPS_KEY is not set)' : ''}.
              {position && (
                <a
                  href={`https://www.google.com/maps?q=${position.lat},${position.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Open {position.lat.toFixed(5)}, {position.lng.toFixed(5)} in Google Maps
                </a>
              )}
            </div>
          ) : !isLoaded ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              <Loader2 size={18} className="animate-spin mr-2" /> Loading map…
            </div>
          ) : position ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={position}
              zoom={16}
              options={{ streetViewControl: false, mapTypeControl: true, fullscreenControl: true }}
            >
              <Marker position={position} title={rental?.user?.name || 'Rider'} />
              {Number(location?.accuracy) > 0 && (
                <Circle
                  center={position}
                  radius={Number(location.accuracy)}
                  options={{ fillColor: '#3b82f6', fillOpacity: 0.12, strokeColor: '#3b82f6', strokeOpacity: 0.5, strokeWeight: 1, clickable: false }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-sm text-gray-500 gap-2">
              {waiting ? <Loader2 size={22} className="animate-spin text-blue-500" /> : <MapPin size={22} className="text-gray-400" />}
              {waiting ? 'No location yet — waiting for the rider…' : 'No location has been shared for this rental yet.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 text-sm">
          <div className="text-gray-600">
            {position ? (
              <>
                <span className="font-semibold text-gray-900">{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</span>
                {Number(location?.accuracy) > 0 && <span className="text-gray-500"> · ±{Math.round(location.accuracy)} m</span>}
                <span className="block text-xs text-gray-400">
                  Updated {fmtDateTime(location.updatedAt)} ({timeAgo(location.updatedAt)})
                </span>
              </>
            ) : (
              <span className="text-gray-400">No coordinates</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {position && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <ExternalLink size={13} /> Directions
              </a>
            )}
            <button
              onClick={onRefresh}
              disabled={waiting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              <RefreshCw size={13} className={waiting ? 'animate-spin' : ''} /> {waiting ? 'Requesting…' : 'Refresh Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
