"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Crosshair, ZoomIn, ZoomOut } from "lucide-react";

interface MapPickerProps {
  lat: number;
  lng: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
  onRadiusChange: (meters: number) => void;
}

export default function MapPicker({ lat, lng, radius, onLocationChange, onRadiusChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
    import("leaflet").then((leaflet) => {
      // Fix default icon paths for webpack/Next.js
      delete (leaflet as any).Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      setL(leaflet);
    });
  }, []);

  useEffect(() => {
    if (!L || !mapRef.current || !mounted) return;

    if (leafletRef.current) {
      leafletRef.current.remove();
      leafletRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [lat || 27.7172, lng || 85.3240],
      zoom: 16,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat || 27.7172, lng || 85.3240], {
      draggable: true,
    }).addTo(map);

    const circle = L.circle([lat || 27.7172, lng || 85.3240], {
      radius: radius || 100,
      color: "#f59e0b",
      fillColor: "#f59e0b",
      fillOpacity: 0.1,
      weight: 2,
      dashArray: "5, 5",
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onLocationChange(pos.lat, pos.lng);
      circle.setLatLng(pos);
    });

    map.on("click", (e: any) => {
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    });

    leafletRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    return () => {
      map.remove();
      leafletRef.current = null;
    };
  }, [L, mounted]);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius || 100);
    }
  }, [radius]);

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const slat = parseFloat(data[0].lat);
        const slng = parseFloat(data[0].lon);
        onLocationChange(slat, slng);
        if (leafletRef.current) {
          leafletRef.current.setView([slat, slng], 16);
          if (markerRef.current) markerRef.current.setLatLng([slat, slng]);
          if (circleRef.current) circleRef.current.setLatLng([slat, slng]);
        }
      }
    } catch {}
  };

  const zoomToCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const clat = pos.coords.latitude;
        const clng = pos.coords.longitude;
        onLocationChange(clat, clng);
        if (leafletRef.current) {
          leafletRef.current.setView([clat, clng], 16);
          if (markerRef.current) markerRef.current.setLatLng([clat, clng]);
          if (circleRef.current) circleRef.current.setLatLng([clat, clng]);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  if (!mounted) {
    return (
      <div className="h-[300px] rounded-lg bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <MapPin className="w-6 h-6 animate-pulse" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchLocation()}
            placeholder="Search location..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background"
          />
        </div>
        <button
          onClick={searchLocation}
          className="px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 shrink-0"
        >
          Search
        </button>
        <button
          onClick={zoomToCurrentLocation}
          type="button"
          title="Use my location"
          className="px-3 py-2 border border-input text-sm rounded-lg hover:bg-muted shrink-0"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Map */}
      <div ref={mapRef} className="h-[300px] rounded-lg border border-input z-0" />

      {/* Coordinate display */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Latitude</label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => {
              const v = parseFloat(e.target.value) || 0;
              onLocationChange(v, lng);
              if (leafletRef.current && markerRef.current && circleRef.current) {
                markerRef.current.setLatLng([v, lng]);
                circleRef.current.setLatLng([v, lng]);
                leafletRef.current.setView([v, lng]);
              }
            }}
            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Longitude</label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => {
              const v = parseFloat(e.target.value) || 0;
              onLocationChange(lat, v);
              if (leafletRef.current && markerRef.current && circleRef.current) {
                markerRef.current.setLatLng([lat, v]);
                circleRef.current.setLatLng([lat, v]);
                leafletRef.current.setView([lat, v]);
              }
            }}
            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
          />
        </div>
      </div>

      {/* Radius slider */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          Geo-fence Radius: <strong>{radius}m</strong>
        </label>
        <input
          type="range"
          min="10"
          max="1000"
          step="10"
          value={radius}
          onChange={(e) => onRadiusChange(parseInt(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>10m</span>
          <span>500m</span>
          <span>1000m</span>
        </div>
      </div>

      <style jsx>{`
        .z-0 { z-index: 0; }
        input[type="range"] { height: 6px; border-radius: 3px; background: #e5e7eb; outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #f59e0b; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
      `}</style>
    </div>
  );
}
