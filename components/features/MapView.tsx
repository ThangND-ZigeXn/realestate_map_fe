"use client";

import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";

import { useQueryClient } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";

import { roomImagesConnect } from "@/lib/api/axios";
import type { DirectionsRoute } from "@/lib/mapbox-directions";
import { MapBoundsInfo, RoomFeature } from "@/types/room";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const DEFAULT_ZOOM = 16;

// Radius constraints (in meters)
const MIN_RADIUS = 5000; // Minimum 5km
const MAX_RADIUS = 50000; // Maximum 50km (API limit)

// Debounce time for map bounds change (ms)
const BOUNDS_CHANGE_DEBOUNCE = 800;

// Calculate raw radius in meters from map bounds (without clamping)
// This calculates the approximate radius that covers the visible map area
function calculateRawRadiusFromBounds(map: mapboxgl.Map): number {
  const bounds = map.getBounds();
  const center = map.getCenter();

  // Get the distance from center to corner of the visible area
  // Using the Haversine formula for accuracy
  if (!bounds) return 0;

  const ne = bounds.getNorthEast();

  const R = 6371000; // Earth's radius in meters
  const lat1 = (center.lat * Math.PI) / 180;
  const lat2 = (ne.lat * Math.PI) / 180;
  const deltaLat = ((ne.lat - center.lat) * Math.PI) / 180;
  const deltaLng = ((ne.lng - center.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Clamp radius to min/max bounds
function clampRadius(radius: number): number {
  return Math.max(MIN_RADIUS, Math.min(radius, MAX_RADIUS));
}

// Calculate distance between two points using Haversine formula
function calculateDistanceBetweenPoints(
  point1: [number, number], // [lng, lat]
  point2: [number, number] // [lng, lat]
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (point1[1] * Math.PI) / 180;
  const lat2 = (point2[1] * Math.PI) / 180;
  const deltaLat = ((point2[1] - point1[1]) * Math.PI) / 180;
  const deltaLng = ((point2[0] - point1[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

interface MapViewProps {
  rooms?: RoomFeature[];
  selectedRoom?: RoomFeature | null;
  onRoomSelect?: (room: RoomFeature) => void;
  onOpenRoomModal?: (room: RoomFeature) => void;
  onMapBoundsChange?: (boundsInfo: MapBoundsInfo) => void; // Callback when map bounds change
  onShowDirections?: (room: RoomFeature) => void;
  isLoading?: boolean;
  center?: [number, number] | null; // [longitude, latitude] - null means waiting for location
  userLocation?: [number, number] | null; // User's current GPS location [longitude, latitude]
  searchOrigin?: [number, number] | null; // Original search location [longitude, latitude] - used to calculate distance when dragging
  route?: DirectionsRoute | null; // Route to display on map
  isPickingOrigin?: boolean; // Mode to pick origin point on map
  onOriginPicked?: (coords: [number, number]) => void;
  customOrigin?: [number, number] | null; // Custom origin point for directions
}

export default function MapView({
  rooms = [],
  selectedRoom,
  onRoomSelect,
  onOpenRoomModal,
  onMapBoundsChange,
  onShowDirections,
  isLoading = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  center = null,
  userLocation = null,
  searchOrigin = null,
  route = null,
  isPickingOrigin = false,
  onOriginPicked,
  customOrigin = null,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const prevCenterRef = useRef<[number, number] | null>(center);
  const onMapBoundsChangeRef = useRef(onMapBoundsChange);
  const searchOriginRef = useRef(searchOrigin);
  const routeLayerAdded = useRef(false);

  // Use React Query's queryClient to share cache with RoomCard
  const queryClient = useQueryClient();

  // Function to get or fetch room image - uses React Query cache for consistency
  const getRoomImage = useCallback(async (roomType: string, roomId: number): Promise<string | null> => {
    const queryKey = ["room-image", roomType, roomId];

    // Check if already in React Query cache
    const cachedData = queryClient.getQueryData<{ image_url: string }>(queryKey);
    if (cachedData?.image_url) {
      return cachedData.image_url;
    }

    try {
      // Fetch and store in React Query cache
      const response = await roomImagesConnect.apiV1RoomImagesRandomGet(
        roomType as "room" | "studio" | "apartment"
      );
      const data = response.data;

      // Store in React Query cache so RoomCard and popup use the same image
      queryClient.setQueryData(queryKey, data);

      return data.image_url;
    } catch {
      return null;
    }
  }, [queryClient]);

  // Keep callback ref updated
  useEffect(() => {
    onMapBoundsChangeRef.current = onMapBoundsChange;
  }, [onMapBoundsChange]);

  // Keep searchOrigin ref updated
  useEffect(() => {
    searchOriginRef.current = searchOrigin;
  }, [searchOrigin]);

  // Ref to track if map has been initialized (to prevent re-init on center change)
  const mapInitializedRef = useRef(false);

  // Initialize map only when center is available (runs only once)
  useEffect(() => {
    // Don't initialize until we have a center
    if (!center) return;
    // Already initialized - don't reinitialize when center changes
    if (mapInitializedRef.current) return;
    if (map.current) return;
    if (!mapContainer.current) return;

    // Mark as initialized to prevent re-running this effect
    mapInitializedRef.current = true;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    // Store initial center
    prevCenterRef.current = center;

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

    // Debounce timer for map bounds change
    let boundsChangeTimer: ReturnType<typeof setTimeout> | null = null;
    // Track last emitted radius to avoid unnecessary API calls
    let lastEmittedRadius: number | null = null;

    // Emit bounds info when map stops moving (after zoom/drag)
    const handleMoveEnd = () => {
      if (!map.current) return;

      // Debounce to avoid too many API calls
      if (boundsChangeTimer) {
        clearTimeout(boundsChangeTimer);
      }

      boundsChangeTimer = setTimeout(() => {
        if (!map.current) return;

        const mapCenter = map.current.getCenter();
        const zoom = map.current.getZoom();
        const viewportRadius = calculateRawRadiusFromBounds(map.current);

        // Calculate distance from search origin to current map center
        // This ensures we fetch data that covers both the origin and the dragged position
        let distanceFromOrigin = 0;
        if (searchOriginRef.current) {
          distanceFromOrigin = calculateDistanceBetweenPoints(
            searchOriginRef.current,
            [mapCenter.lng, mapCenter.lat]
          );
        }

        // Total radius = distance from origin + viewport radius
        // This ensures all rooms between origin and current view are fetched
        const totalRadius = distanceFromOrigin + viewportRadius;

        // If total radius < MIN_RADIUS, use MIN_RADIUS
        // The API requires at least MIN_RADIUS
        const clampedRadius = clampRadius(totalRadius);

        // Skip if radius hasn't changed significantly (within 10% tolerance)
        if (lastEmittedRadius !== null) {
          const radiusDiff = Math.abs(clampedRadius - lastEmittedRadius);
          const threshold = lastEmittedRadius * 0.1; // 10% threshold
          if (radiusDiff < threshold) {
            return;
          }
        }

        lastEmittedRadius = clampedRadius;

        onMapBoundsChangeRef.current?.({
          center: [mapCenter.lng, mapCenter.lat],
          zoom,
          radius: clampedRadius,
        });
      }, BOUNDS_CHANGE_DEBOUNCE);
    };

    map.current.on("load", () => {
      setMapLoaded(true);

      // Emit initial bounds after map loads
      if (map.current) {
        const mapCenter = map.current.getCenter();
        const zoom = map.current.getZoom();
        const rawRadius = calculateRawRadiusFromBounds(map.current);
        const clampedRadius = clampRadius(rawRadius);

        lastEmittedRadius = clampedRadius;

        onMapBoundsChangeRef.current?.({
          center: [mapCenter.lng, mapCenter.lat],
          zoom,
          radius: clampedRadius,
        });
      }
    });

    // Listen for map movement end (after zoom or drag)
    map.current.on("moveend", handleMoveEnd);

    // Store cleanup functions in refs to be called on unmount
    const currentMap = map.current;
    const currentTimer = boundsChangeTimer;

    return () => {
      if (currentTimer) {
        clearTimeout(currentTimer);
      }
      currentMap?.off("moveend", handleMoveEnd);
      currentMap?.remove();
      map.current = null;
      mapInitializedRef.current = false;
    };
    // Only run this effect once when center becomes available for the first time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!center]); // Use !!center to only trigger when center goes from null to non-null

  // Fly to new center when it changes (after initial load)
  useEffect(() => {
    if (!map.current || !mapLoaded || !center) return;

    // Check if center actually changed
    const prev = prevCenterRef.current;
    if (!prev) {
      prevCenterRef.current = center;
      return;
    }

    const [prevLng, prevLat] = prev;
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

  // Handle pick origin mode - click on map to set origin
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (isPickingOrigin && onOriginPicked) {
        const { lng, lat } = e.lngLat;
        onOriginPicked([lng, lat]);
      }
    };

    if (isPickingOrigin) {
      mapInstance.getCanvas().style.cursor = "crosshair";
      mapInstance.on("click", handleMapClick);
    } else {
      mapInstance.getCanvas().style.cursor = "";
    }

    return () => {
      mapInstance.off("click", handleMapClick);
      mapInstance.getCanvas().style.cursor = "";
    };
  }, [isPickingOrigin, onOriginPicked, mapLoaded]);

  // Display custom origin marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing origin marker
    if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    // Add new origin marker if custom origin is set
    if (customOrigin) {
      const [lng, lat] = customOrigin;

      const el = document.createElement("div");
      el.className = "origin-marker";
      el.innerHTML = `
        <div class="origin-marker-container">
          <div class="origin-marker-icon">📍</div>
        </div>
      `;

      originMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
  }, [customOrigin, mapLoaded]);

  // Display route on map
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;

    // Remove existing route layer and source
    if (routeLayerAdded.current) {
      if (mapInstance.getLayer("route-line")) {
        mapInstance.removeLayer("route-line");
      }
      if (mapInstance.getLayer("route-outline")) {
        mapInstance.removeLayer("route-outline");
      }
      if (mapInstance.getSource("route")) {
        mapInstance.removeSource("route");
      }
      routeLayerAdded.current = false;
    }

    // Add new route if available
    if (route && route.geometry) {
      // Add route source
      mapInstance.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        },
      });

      // Add route outline (for better visibility)
      mapInstance.addLayer({
        id: "route-outline",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#1e40af",
          "line-width": 8,
          "line-opacity": 0.4,
        },
      });

      // Add route line
      mapInstance.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 5,
        },
      });

      routeLayerAdded.current = true;

      // Fit map to show entire route
      const coordinates = route.geometry.coordinates;
      if (coordinates.length > 0) {
        const bounds = coordinates.reduce(
          (bounds, coord) => bounds.extend(coord as [number, number]),
          new mapboxgl.LngLatBounds(
            coordinates[0] as [number, number],
            coordinates[0] as [number, number]
          )
        );

        mapInstance.fitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 350, right: 100 },
          duration: 1000,
        });
      }
    }
  }, [route, mapLoaded]);

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

      // Create popup with image, "Xem chi tiết" and "Chỉ đường" buttons
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: "300px",
      }).setHTML(`
        <div class="room-popup" data-room-id="${properties.id}">
          <div class="popup-image-container" data-room-id="${properties.id}">
            <div class="popup-image-placeholder">
              <div class="popup-image-spinner"></div>
            </div>
          </div>
          <div class="popup-content">
            <h3 class="popup-title">${properties.title}</h3>
            <p class="popup-address">${properties.address || ""}</p>
            <div class="popup-details">
              <span class="popup-price">${properties.price.toLocaleString(
                "vi-VN"
              )} đ/tháng</span>
              <span class="popup-area">${properties.area || 0} m²</span>
            </div>
            <div class="popup-buttons">
              <button class="popup-view-detail-btn" data-room-id="${
                properties.id
              }">
                Xem chi tiết
              </button>
              <button class="popup-directions-btn" data-room-id="${
                properties.id
              }">
                🧭 Chỉ đường
              </button>
            </div>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current!);

      // Handle popup open to attach click handlers for buttons and load image
      popup.on("open", () => {
        // Use setTimeout to ensure DOM is ready
        setTimeout(async () => {
          // Load room image
          const imageContainer = document.querySelector(
            `.popup-image-container[data-room-id="${properties.id}"]`
          );
          if (imageContainer) {
            const imageUrl = await getRoomImage(properties.roomType, properties.id);
            if (imageUrl) {
              imageContainer.innerHTML = `
                <img src="${imageUrl}" alt="${properties.title}" class="popup-image" />
              `;
            } else {
              imageContainer.innerHTML = `
                <div class="popup-image-placeholder">
                  <span class="popup-no-image">🏠</span>
                </div>
              `;
            }
          }

          // "Xem chi tiết" button
          const detailBtn = document.querySelector(
            `.popup-view-detail-btn[data-room-id="${properties.id}"]`
          );
          if (detailBtn) {
            detailBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              onOpenRoomModal?.(room);
              popup.remove();
            });
          }

          // "Chỉ đường" button
          const directionsBtn = document.querySelector(
            `.popup-directions-btn[data-room-id="${properties.id}"]`
          );
          if (directionsBtn) {
            directionsBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              onShowDirections?.(room);
              popup.remove();
            });
          }
        }, 0);
      });

      // Handle marker click - open popup and fly to room
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

        // Fly to this room
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 17,
          duration: 1000,
        });

        // Open popup (not toggle - always open on click)
        if (!popup.isOpen()) {
          marker.togglePopup();
        }
      });

      markersRef.current.push(marker);
    });
  }, [rooms, mapLoaded, selectedRoom, onRoomSelect, onOpenRoomModal, onShowDirections, getRoomImage]);

  // Open popup for selected room when it changes from external source (e.g., RoomCard click)
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedRoom) return;

    // Find the marker for selected room and open its popup
    const markerIndex = rooms.findIndex(
      (r) => r.properties.id === selectedRoom.properties.id
    );

    if (markerIndex !== -1 && markersRef.current[markerIndex]) {
      // Close all other popups first
      markersRef.current.forEach((m, i) => {
        const p = m.getPopup();
        if (p && p.isOpen() && i !== markerIndex) {
          p.remove();
        }
      });

      // Open popup for selected room
      const popup = markersRef.current[markerIndex].getPopup();
      if (popup && !popup.isOpen()) {
        markersRef.current[markerIndex].togglePopup();
      }
    }
  }, [selectedRoom, rooms, mapLoaded]);

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

        /* Custom origin marker styles */
        .origin-marker {
          cursor: pointer;
        }

        .origin-marker-container {
          background: white;
          border: 2px solid #059669;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .origin-marker-icon {
          font-size: 16px;
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

        .popup-image-container {
          width: 100%;
          height: 120px;
          overflow: hidden;
        }

        .popup-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }

        .popup-image-placeholder {
          width: 100%;
          height: 120px;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup-image-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .popup-no-image {
          font-size: 32px;
          opacity: 0.5;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
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

        .popup-buttons {
          display: flex;
          gap: 8px;
        }

        .popup-view-detail-btn {
          flex: 1;
          padding: 8px 12px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .popup-view-detail-btn:hover {
          background: #1d4ed8;
        }

        .popup-directions-btn {
          flex: 1;
          padding: 8px 12px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .popup-directions-btn:hover {
          background: #047857;
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
      {/* Background with loading spinner when no center (map not initialized) */}
      {!center && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Đang xác định vị trí...
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}tr`;
  }
  return `${(price / 1000).toFixed(0)}k`;
}
