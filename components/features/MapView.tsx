"use client";

import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

import { Room } from "@/types/room";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface MapViewProps {
  rooms?: Room[];
  selectedRoom?: Room | null;
  onRoomSelect?: (room: Room) => void;
}

export default function MapView({
  rooms = [],
  selectedRoom,
  onRoomSelect,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [106.700806, 10.773884], // TP.HCM center
      zoom: 12,
      attributionControl: false,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Add geolocation control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "bottom-right"
    );

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-left");

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers for rooms
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    rooms.forEach((room) => {
      // Create custom marker element
      const el = document.createElement("div");
      el.className = "room-marker";
      el.innerHTML = `
        <div class="marker-container ${
          selectedRoom?.id === room.id ? "selected" : ""
        }">
          <div class="marker-price">${formatPrice(room.price)}</div>
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: "300px",
      }).setHTML(`
        <div class="room-popup">
          <img src="${room.images[0]}" alt="${
        room.title
      }" class="popup-image" onerror="this.style.display='none'" />
          <div class="popup-content">
            <h3 class="popup-title">${room.title}</h3>
            <p class="popup-address">${room.address}</p>
            <div class="popup-details">
              <span class="popup-price">${room.price.toLocaleString(
                "vi-VN"
              )} VNĐ/tháng</span>
              <span class="popup-area">${room.area} m²</span>
            </div>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([room.longitude, room.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      // Handle marker click
      el.addEventListener("click", () => {
        onRoomSelect?.(room);
      });

      markersRef.current.push(marker);
    });
  }, [rooms, mapLoaded, selectedRoom, onRoomSelect]);

  // Fly to selected room
  useEffect(() => {
    if (!map.current || !selectedRoom) return;

    map.current.flyTo({
      center: [selectedRoom.longitude, selectedRoom.latitude],
      zoom: 15,
      duration: 1500,
    });

    // Open popup for selected room
    const markerIndex = rooms.findIndex((r) => r.id === selectedRoom.id);
    if (markerIndex !== -1 && markersRef.current[markerIndex]) {
      const popup = markersRef.current[markerIndex].getPopup();
      if (popup && !popup.isOpen()) {
        markersRef.current[markerIndex].togglePopup();
      }
    }
  }, [selectedRoom, rooms]);

  return (
    <>
      <style jsx global>{`
        .room-marker {
          cursor: pointer;
        }

        .marker-container {
          background: white;
          border: 2px solid #2563eb;
          border-radius: 8px;
          padding: 4px 8px;
          font-weight: 600;
          font-size: 12px;
          color: #1e40af;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .marker-container:hover,
        .marker-container.selected {
          background: #2563eb;
          color: white;
          transform: scale(1.1);
        }

        .room-popup {
          font-family: system-ui, -apple-system, sans-serif;
        }

        .popup-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 8px 8px 0 0;
        }

        .popup-content {
          padding: 12px;
        }

        .popup-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .popup-address {
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 8px 0;
        }

        .popup-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .popup-price {
          font-size: 13px;
          font-weight: 600;
          color: #059669;
        }

        .popup-area {
          font-size: 12px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
        }

        .mapboxgl-popup-close-button {
          font-size: 18px;
          color: white;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          top: 8px;
          right: 8px;
        }

        .mapboxgl-popup-close-button:hover {
          background: rgba(0, 0, 0, 0.7);
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </>
  );
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}tr`;
  }
  return `${(price / 1000).toFixed(0)}k`;
}
