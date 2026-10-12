"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { reportCategories, reportStatuses } from "@/lib/report-constants";

export interface MapReport {
  id: string;
  title: string;
  category: (typeof reportCategories)[number];
  status: (typeof reportStatuses)[number];
  location: {
    address: string;
    coordinates?: [number, number];
  };
}

interface ReportMapProps {
  reports: MapReport[];
}

const categoryLabels: Record<(typeof reportCategories)[number], string> = {
  roads: "Roads and sidewalks",
  garbage: "Garbage and litter",
  streetlights: "Streetlights",
  water: "Water",
  drainage: "Drainage",
  other: "Other",
};

const statusLabels: Record<(typeof reportStatuses)[number], string> = {
  pending: "Pending",
  "in-progress": "In progress",
  resolved: "Resolved",
};

function hasValidCoordinates(
  coordinates: [number, number] | undefined,
): coordinates is [number, number] {
  return (
    coordinates !== undefined &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1]) &&
    coordinates[0] >= -180 &&
    coordinates[0] <= 180 &&
    coordinates[1] >= -90 &&
    coordinates[1] <= 90
  );
}

function createPopupContent(report: MapReport): HTMLElement {
  const content = document.createElement("div");
  content.className = "urbanly-map-popup";

  const title = document.createElement("h2");
  title.className = "urbanly-map-popup-title";
  title.textContent = report.title;

  const category = document.createElement("p");
  category.textContent = categoryLabels[report.category];

  const status = document.createElement("p");
  status.textContent = `Status: ${statusLabels[report.status]}`;

  const address = document.createElement("p");
  address.textContent = report.location.address;

  content.append(title, category, status, address);
  return content;
}

export function ReportMap({ reports }: ReportMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

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
            setMapError("The map could not be initialized. Please try again.");
          }
        });
      } catch {
        if (!cancelled) {
          setMapError("The interactive map could not be initialized.");
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;

    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    void import("maplibre-gl").then((maplibre) => {
      if (mapInstance.current !== map) return;

      markers.current = reports.flatMap((report) => {
        const coordinates = report.location.coordinates;
        if (!hasValidCoordinates(coordinates)) return [];

        const element = document.createElement("button");
        element.type = "button";
        element.className = "urbanly-map-marker";
        element.setAttribute(
          "aria-label",
          `${report.title}, ${categoryLabels[report.category]}, ${statusLabels[report.status]}`,
        );
        element.title = report.title;

        const marker = new maplibre.Marker({ element, anchor: "bottom" })
          .setLngLat(coordinates)
          .setPopup(
            new maplibre.Popup({ offset: 24, maxWidth: "300px" }).setDOMContent(
              createPopupContent(report),
            ),
          )
          .addTo(map);

        return [marker];
      });
    });
  }, [mapReady, reports]);

  return (
    <div className="relative">
      <div
        aria-label="Map of community reports"
        className="h-[60vh] min-h-[400px] w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-[68vh] sm:min-h-[520px]"
        ref={mapElement}
      />
      {!mapReady && !mapError && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl bg-slate-100/90 text-sm font-medium text-slate-600"
        >
          Loading map…
        </div>
      )}
      {mapError && (
        <div
          className="absolute inset-0 grid place-items-center rounded-2xl bg-slate-100/95 p-6 text-center"
          role="alert"
        >
          <p className="max-w-sm text-sm leading-6 text-slate-700">{mapError}</p>
        </div>
      )}
    </div>
  );
}
