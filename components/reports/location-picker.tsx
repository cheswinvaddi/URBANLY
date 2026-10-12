"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";

type Coordinates = [longitude: number, latitude: number];

interface LocationPickerProps {
  coordinates: Coordinates | null;
  onCoordinatesChange: (coordinates: Coordinates | null) => void;
}

function isValidCoordinates(longitude: number, latitude: number): boolean {
  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function getGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access was denied. You can still select a point on the map.";
    case error.POSITION_UNAVAILABLE:
      return "Your current location is unavailable. Try selecting a point on the map.";
    case error.TIMEOUT:
      return "Finding your current location took too long. Please try again.";
    default:
      return "We couldn’t get your current location. Select a point on the map instead.";
  }
}

export function LocationPicker({
  coordinates,
  onCoordinatesChange,
}: LocationPickerProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    onCoordinatesChangeRef.current = onCoordinatesChange;
  }, [onCoordinatesChange]);

  useEffect(() => {
    let cancelled = false;
    let loaded = false;
    let map: MapLibreMap | null = null;

    async function initializeMap() {
      try {
        const maplibre = await import("maplibre-gl");
        if (cancelled || !mapElement.current) return;

        map = new maplibre.Map({
          container: mapElement.current,
          center: [78.4867, 17.385],
          zoom: 11,
          style: {
            version: 8,
            sources: {
              carto: {
                type: "raster",
                tiles: [
                  "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
                ],
                tileSize: 256,
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
              },
            },
            layers: [
              {
                id: "carto-voyager",
                type: "raster",
                source: "carto",
              },
            ],
          },
          cooperativeGestures: true,
        });

        mapInstance.current = map;
        map.addControl(new maplibre.NavigationControl(), "top-right");
        map.once("load", () => {
          loaded = true;
          if (!cancelled) setMapReady(true);
        });
        map.on("error", () => {
          if (!cancelled && !loaded) {
            setMapError("The location map could not be initialized.");
          }
        });
        map.on("click", (event) => {
          if (
            !isValidCoordinates(event.lngLat.lng, event.lngLat.lat)
          ) {
            return;
          }
          onCoordinatesChangeRef.current([
            event.lngLat.lng,
            event.lngLat.lat,
          ]);
          setLocationError(null);
        });
      } catch {
        if (!cancelled) {
          setMapError("The location map could not be initialized.");
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      map?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;

    if (!coordinates) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!isValidCoordinates(coordinates[0], coordinates[1])) return;

    void import("maplibre-gl").then((maplibre) => {
      if (mapInstance.current !== map) return;

      if (markerRef.current) {
        markerRef.current.setLngLat(coordinates);
      } else {
        const markerElement = document.createElement("div");
        markerElement.className = "urbanly-map-marker";
        markerElement.setAttribute("aria-hidden", "true");
        markerRef.current = new maplibre.Marker({
          element: markerElement,
          anchor: "bottom",
        })
          .setLngLat(coordinates)
          .addTo(map);
      }
    });
  }, [coordinates, mapReady]);

  function useCurrentLocation() {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError(
        "This browser doesn’t support location access. Select a point on the map instead.",
      );
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (!isValidCoordinates(longitude, latitude)) {
          setLocationError(
            "Your browser returned coordinates outside the valid geographic range.",
          );
          setLocating(false);
          return;
        }

        onCoordinatesChange([longitude, latitude]);
        mapInstance.current?.easeTo({
          center: [longitude, latitude],
          zoom: 15,
        });
        setLocating(false);
      },
      (error) => {
        setLocationError(getGeolocationError(error));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-800">
          Select an exact point <span className="font-normal text-slate-500">(optional)</span>
        </p>
        <button
          className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-emerald-800/20 bg-white px-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-60"
          disabled={locating}
          onClick={useCurrentLocation}
          type="button"
        >
          {locating ? "Finding your location…" : "Use my current location"}
        </button>
      </div>

      <p className="text-xs leading-5 text-slate-600" id="location-map-help">
        Click the map to place or move the marker. The address field is separate;
        selecting a point does not verify or fill in an address.
      </p>

      <div className="relative">
        <div
          aria-label="Select a report location on the map"
          aria-describedby="location-map-help"
          className="h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-80"
          ref={mapElement}
          role="application"
          tabIndex={0}
        />
        {!mapReady && !mapError && (
          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-slate-100/90 text-sm text-slate-600"
          >
            Loading location map…
          </div>
        )}
        {mapError && (
          <div
            className="absolute inset-0 grid place-items-center rounded-xl bg-slate-100/95 p-4 text-center text-sm text-rose-900"
            role="alert"
          >
            {mapError}
          </div>
        )}
      </div>

      {coordinates ? (
        <div className="flex flex-col gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite">
            Selected coordinates: latitude {coordinates[1].toFixed(6)}, longitude{" "}
            {coordinates[0].toFixed(6)}
          </p>
          <button
            className="min-h-9 w-fit rounded-lg px-2 text-sm font-semibold text-emerald-900 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            onClick={() => onCoordinatesChange(null)}
            type="button"
          >
            Clear selected point
          </button>
        </div>
      ) : (
        <p aria-live="polite" className="text-xs text-slate-500">
          No point selected. You can submit an address without coordinates.
        </p>
      )}

      {locationError && (
        <p aria-live="assertive" className="text-sm text-rose-800" role="alert">
          {locationError}
        </p>
      )}
    </div>
  );
}
