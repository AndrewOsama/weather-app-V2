import { useEffect, useRef, useState } from "react";
import { MapPin, ZoomIn, ZoomOut } from "lucide-react";
import { Language } from "../types";
import { getTranslation } from "../locales";

interface WeatherMapProps {
  lat: number;
  lon: number;
  cityName: string;
  lang: Language;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function WeatherMap({ lat, lon, cityName, lang }: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);

  // Load Leaflet assets dynamically if not already loaded
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.onload = () => {
      setLeafletLoaded(true);
    };
    script.onerror = () => {
      setLoadingError(true);
    };

    document.head.appendChild(script);

    return () => {
      // Keep style & script to avoid reloading if they are already added, but ensure we remove map references
    };
  }, []);

  // Initialize and update the map when leaflet is loaded or lat/lon changes
  useEffect(() => {
    if (!leafletLoaded || !window.L || !mapContainerRef.current) return;

    // Destroy existing map instance to avoid container reuse errors
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const L = window.L;

      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      // Add modern, beautiful dark/light tile layer based on current look
      // We'll use CARTO's Voyager tiles which look incredibly slick and professional
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(map);

      // Add marker with customized icon styling (red/indigo pin)
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full bg-indigo-500/30 animate-ping"></div>
            <div class="relative w-6 h-6 rounded-full bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
      
      // Bind descriptive popup
      marker.bindPopup(`
        <div class="text-slate-900 font-sans p-1 text-center" style="font-family: inherit;">
          <h4 class="font-bold text-sm leading-tight">${cityName}</h4>
          <p class="text-xs text-slate-500 mt-1">Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}</p>
        </div>
      `, {
        closeButton: false,
        offset: [0, -12]
      }).openPopup();

    } catch (error) {
      console.error("Leaflet initialization failed:", error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, lat, lon, cityName]);

  return (
    <div className="w-full h-full flex flex-col" id="weather-map-section">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-400" id="map-pin-icon" />
          <h3 className="font-semibold text-lg text-white" id="map-title-text">
            {getTranslation(lang, "weatherMap")}
          </h3>
        </div>
        <div className="text-xs text-white/60 font-semibold font-mono" id="map-coords-display">
          {lat.toFixed(3)}°N, {lon.toFixed(3)}°E
        </div>
      </div>

      <div className="relative flex-grow w-full rounded-[24px] overflow-hidden border border-white/20 shadow-2xl" style={{ minHeight: "260px" }}>
        {!leafletLoaded && !loadingError && (
          <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-md flex flex-col items-center justify-center z-10 gap-3" id="map-loading-indicator">
            <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-white/80 font-semibold">Loading Interactive Map...</span>
          </div>
        )}

        {loadingError && (
          <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-md flex flex-col items-center justify-center z-10 p-4 text-center gap-2" id="map-error-indicator">
            <MapPin className="w-8 h-8 text-rose-400" />
            <span className="text-sm text-rose-300 font-bold">Failed to load Map. Check connection.</span>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: "260px" }} id="map-leaflet-element" />
      </div>
    </div>
  );
}
