import { LocateFixed } from "lucide-react";
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { env } from '../../config/env';
import { useCallback, useState } from 'react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946
};

const ChargingMap = ({ stations }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: env.mapsKey
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(map) {
    if (stations && stations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;
      stations.forEach(station => {
        if (station.lat && station.lng) {
          bounds.extend({ lat: parseFloat(station.lat), lng: parseFloat(station.lng) });
          hasValidCoords = true;
        }
      });
      if (hasValidCoords) {
        map.fitBounds(bounds);
        // Prevent zoom from being too close if there's only one marker
        const listener = window.google.maps.event.addListener(map, "idle", function() { 
          if (map.getZoom() > 14) map.setZoom(14); 
          window.google.maps.event.removeListener(listener); 
        });
      } else {
        map.setCenter(defaultCenter);
        map.setZoom(12);
      }
    } else {
      map.setCenter(defaultCenter);
      map.setZoom(12);
    }
    setMap(map);
  }, [stations]);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  return (
    <div className="px-5 mb-8 relative">
      <div className="w-full h-[160px] rounded-[24px] overflow-hidden shadow-sm border border-gray-200 relative bg-[#E5E3DF]">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
            }}
          >
            {stations.map((station, idx) => (
              station.lat && station.lng ? (
                <Marker
                  key={station.id || idx}
                  position={{ lat: parseFloat(station.lat), lng: parseFloat(station.lng) }}
                  icon={{
                    url: station.isElectica ? 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                  }}
                />
              ) : null
            ))}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-medium">
            Loading Map...
          </div>
        )}
      </div>
      
      {/* Locate Me Floating Button */}
      <button 
        className="absolute bottom-4 right-9 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 text-gray-700 hover:text-[#272664] active:scale-95 transition-all z-10"
        onClick={() => {
          if (map && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                map.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
                map.setZoom(14);
              },
              () => { console.log('Geolocation failed'); }
            );
          }
        }}
      >
        <LocateFixed size={20} strokeWidth={2} />
      </button>
    </div>
  );
};

export default ChargingMap;
