"use client";

import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

import { RoomFeature } from "@/types/room";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Default center (Ho Chi Minh City)
const DEFAULT_CENTER: [number, number] = [106.700806, 10.773884];

interface MapViewProps {
  rooms?: RoomFeature[];
  selectedRoom?: RoomFeature | null;
  onRoomSelect?: (room: RoomFeature) => void;
  onOpenRoomModal?: (room: RoomFeature) => void;
  isLoading?: boolean;
  center?: [number, number]; // [longitude, latitude]
  userLocation?: [number, number] | null; // User's current GPS location [longitude, latitude]
}

export default function MapView({
  rooms = [],
  selectedRoom,
  onRoomSelect,
  onOpenRoomModal,
  isLoading = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  center = DEFAULT_CENTER,
  userLocation = null,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const prevCenterRef = useRef<[number, number]>(center);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to new center when it changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Check if center actually changed
    const [prevLng, prevLat] = prevCenterRef.current;
    const [newLng, newLat] = center;

    if (prevLng !== newLng || prevLat !== newLat) {
      map.current.flyTo({
        center: center,
        zoom: 16,
        duration: 1500,
      });
      prevCenterRef.current = center;
    }
  }, [center, mapLoaded]);

  // Add/update user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // Add new user marker if location is available
    if (userLocation) {
      const [lng, lat] = userLocation;

      // Create custom user location marker element
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.innerHTML = `
        <div class="user-marker-outer">
          <div class="user-marker-inner"></div>
        </div>
        <div class="user-marker-pulse"></div>
      `;

      // Create popup for user location
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: true,
      }).setHTML(`
        <div class="user-popup">
          <p class="user-popup-text">📍 Vị trí của bạn</p>
        </div>
      `);

      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current);
    }
  }, [userLocation, mapLoaded]);

  // Add markers for rooms
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    rooms.forEach((room) => {
      const { properties, geometry } = room;
      const [longitude, latitude] = geometry.coordinates;

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "room-marker";
      el.innerHTML = `
        <div class="marker-container ${
          selectedRoom?.properties.id === properties.id ? "selected" : ""
        }">
          <div class="marker-price">${formatPrice(properties.price)}</div>
        </div>
      `;

      // Create popup with "Xem chi tiết" button
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: "280px",
      }).setHTML(`
        <div class="room-popup" data-room-id="${properties.id}">
          <div class="popup-content">
            <h3 class="popup-title">${properties.title}</h3>
            <p class="popup-address">${properties.address || ""}</p>
            <div class="popup-details">
              <span class="popup-price">${properties.price.toLocaleString(
                "vi-VN"
              )} đ/tháng</span>
              <span class="popup-area">${properties.area || 0} m²</span>
            </div>
            <button class="popup-view-detail-btn" data-room-id="${
              properties.id
            }">
              Xem chi tiết
            </button>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current!);

      // Handle popup open to attach click handler for "Xem chi tiết" button
      popup.on("open", () => {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          const btn = document.querySelector(
            `.popup-view-detail-btn[data-room-id="${properties.id}"]`
          );
          if (btn) {
            btn.addEventListener("click", (e) => {
              e.stopPropagation();
              onOpenRoomModal?.(room); // Open modal only, no fly
              popup.remove(); // Close popup when opening modal
            });
          }
        }, 0);
      });

      // Handle marker click - toggle popup and select room (highlight)
      el.addEventListener("click", (e) => {
        e.stopPropagation();

        // Close all other popups first
        markersRef.current.forEach((m) => {
          const p = m.getPopup();
          if (p && p.isOpen() && m !== marker) {
            p.remove();
          }
        });

        // Select this room (for highlighting)
        onRoomSelect?.(room);

        // Toggle this popup
        if (!popup.isOpen()) {
          marker.togglePopup();
        }
      });

      markersRef.current.push(marker);
    });
  }, [rooms, mapLoaded, selectedRoom, onRoomSelect, onOpenRoomModal]);

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

        /* User location marker styles */
        .user-location-marker {
          position: relative;
          width: 24px;
          height: 24px;
        }

        .user-marker-outer {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          background: rgba(37, 99, 235, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-marker-inner {
          width: 14px;
          height: 14px;
          background: #2563eb;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .user-marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: rgba(37, 99, 235, 0.3);
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        .user-popup {
          padding: 8px 12px;
        }

        .user-popup-text {
          margin: 0;
          font-size: 13px;
          font-weight: 500;
          color: #1f2937;
        }

        .room-popup {
          font-family: system-ui, -apple-system, sans-serif;
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
          margin-bottom: 12px;
        }

        .popup-view-detail-btn {
          width: 100%;
          padding: 8px 16px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .popup-view-detail-btn:hover {
          background: #1d4ed8;
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

        .popup-phone {
          font-size: 12px;
          color: #2563eb;
          margin: 8px 0 0 0;
        }

        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
        }

        .mapboxgl-popup-close-button {
          font-size: 18px;
          color: #374151;
          background: rgba(255, 255, 255, 0.9);
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
          background: rgba(255, 255, 255, 1);
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
