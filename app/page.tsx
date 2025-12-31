"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import AIComparisonBox from "@/components/features/AIAssistant/AIComparisonBox";
import DirectionsPanel from "@/components/features/DirectionsPanel";
import FilterBar from "@/components/features/FilterBar";
import LocationPrompt from "@/components/features/LocationPrompt";
import MapView from "@/components/features/MapView";
import RoomDetailModal from "@/components/features/RoomDetailModal";
import RoomListSidebar from "@/components/features/RoomListSidebar";
import RoomViewingsSheet from "@/components/features/RoomViewingsSheet";
import type { DirectionsRoute } from "@/lib/mapbox-directions";
import { useRooms } from "@/lib/react-query/rooms/use-room";
import type { FilterValues, MapBoundsInfo, RoomFeature } from "@/types/room";

// Default radius for initial load (5km)
const DEFAULT_RADIUS = 5000;

const INITIAL_FILTERS: FilterValues = {
  address: "",
  addressRadius: DEFAULT_RADIUS,
  minPrice: undefined,
  maxPrice: undefined,
  minArea: undefined,
  maxArea: undefined,
  roomType: "",
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// Mapbox Geocoding API for reverse geocoding (coordinates -> address)
async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&language=vi&types=address,place,locality,neighborhood`
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name || "";
    }
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

// Mapbox Geocoding API for forward geocoding (address -> coordinates)
async function geocodeAddress(
  address: string
): Promise<[number, number] | null> {
  if (!address) return null;

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${MAPBOX_TOKEN}&language=vi&country=VN&limit=1`
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return [lng, lat];
    }
    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

export default function Home() {
  // filters: for input fields (changes on every keystroke)
  const [filters, setFilters] = useState<FilterValues>(INITIAL_FILTERS);
  // appliedFilters: for API calls (changes only when "Apply" button is clicked or on initial load)
  const [appliedFilters, setAppliedFilters] = useState<FilterValues | null>(
    null
  );

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomFeature | null>(null);

  // Map center coordinates [longitude, latitude] - null until GPS or user input
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // User's current GPS location [longitude, latitude]
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  // Room detail modal state
  const [modalRoom, setModalRoom] = useState<RoomFeature | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Current map radius from map bounds (updated on zoom/drag)
  const [currentMapRadius, setCurrentMapRadius] =
    useState<number>(DEFAULT_RADIUS);

  // Control location prompt dialog visibility
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Search origin - the original location used for API search
  // This stays fixed while user drags the map, used to calculate distance for addressRadius
  const [searchOrigin, setSearchOrigin] = useState<[number, number] | null>(
    null
  );

  // Track if we've tried auto GPS request
  const gpsAutoRequested = useRef(false);

  // AI Comparison state
  const [comparisonRooms, setComparisonRooms] = useState<RoomFeature[]>([]);

  // Sidebar open state (for AI box positioning)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Directions state
  const [directionsRoom, setDirectionsRoom] = useState<RoomFeature | null>(
    null
  );
  const [currentRoute, setCurrentRoute] = useState<DirectionsRoute | null>(
    null
  );
  const [isPickingOrigin, setIsPickingOrigin] = useState(false);
  const [customOrigin, setCustomOrigin] = useState<[number, number] | null>(
    null
  );

  // Build query params from appliedFilters - filter out empty/undefined values
  const queryParams =
    appliedFilters === null
      ? undefined
      : {
          address: appliedFilters.address || undefined,
          addressRadius:
            currentMapRadius || appliedFilters.addressRadius || DEFAULT_RADIUS,
          minPrice: appliedFilters.minPrice || undefined,
          maxPrice: appliedFilters.maxPrice || undefined,
          minArea: appliedFilters.minArea || undefined,
          maxArea: appliedFilters.maxArea || undefined,
          roomType: appliedFilters.roomType || undefined,
        };

  // Fetch rooms from API - only refetches when appliedFilters changes
  const {
    data: rooms = [],
    isLoading,
    error,
  } = useRooms(queryParams, { enabled: appliedFilters !== null });

  // Check if geolocation is supported
  const isGeoLocationSupported =
    typeof navigator !== "undefined" && !!navigator.geolocation;

  // Auto-request GPS on mount if supported
  // Show the prompt immediately AND request GPS permission at the same time
  useEffect(() => {
    if (gpsAutoRequested.current) return;
    gpsAutoRequested.current = true;

    const requestGPS = () => {
      if (!isGeoLocationSupported) {
        // GPS not supported - show prompt for manual input only
        setShowLocationPrompt(true);
        return;
      }

      // Show prompt AND request GPS permission simultaneously
      // User sees our custom dialog while browser shows GPS permission dialog
      setShowLocationPrompt(true);
      setIsGettingLocation(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Set map center, search origin, and user location marker
          setMapCenter([longitude, latitude]);
          setSearchOrigin([longitude, latitude]); // Set as new search origin
          setUserLocation([longitude, latitude]);

          // Use Mapbox Geocoding API for reverse geocoding
          const locationAddress = await reverseGeocode(latitude, longitude);

          const newFilters: FilterValues = {
            ...INITIAL_FILTERS,
            address: locationAddress,
          };
          setFilters(newFilters);
          setAppliedFilters(newFilters);
          setIsGettingLocation(false);
          // Close prompt - we got location successfully
          setShowLocationPrompt(false);
        },
        () => {
          // GPS denied or failed - keep prompt open for manual input
          setIsGettingLocation(false);
          // Prompt is already shown, just stop loading
        }
      );
    };

    // Delay to avoid sync setState in effect body
    const timer = setTimeout(requestGPS, 0);
    return () => clearTimeout(timer);
  }, [isGeoLocationSupported]);

  // Handle GPS request from LocationPrompt or FilterBar
  const handleGetCurrentLocation = useCallback(() => {
    if (!isGeoLocationSupported) {
      setLocationError("Trình duyệt không hỗ trợ GPS.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Set map center, search origin, and user location marker
        setMapCenter([longitude, latitude]);
        setSearchOrigin([longitude, latitude]); // Set as new search origin
        setUserLocation([longitude, latitude]);

        // Use Mapbox Geocoding API for reverse geocoding
        const locationAddress = await reverseGeocode(latitude, longitude);

        const newFilters: FilterValues = {
          ...INITIAL_FILTERS,
          address: locationAddress,
        };
        setFilters(newFilters);
        setAppliedFilters(newFilters);
        setIsGettingLocation(false);
      },
      () => {
        setLocationError("Không thể lấy vị trí. Vui lòng thử lại.");
        setIsGettingLocation(false);
      }
    );
  }, [isGeoLocationSupported]);

  // Handle search location from LocationPrompt
  const handleSearchLocation = useCallback(async (address: string) => {
    setIsGettingLocation(true);
    setLocationError(null);

    const coordinates = await geocodeAddress(address);

    if (coordinates) {
      setMapCenter(coordinates);
      setSearchOrigin(coordinates); // Set as new search origin

      const newFilters: FilterValues = {
        ...INITIAL_FILTERS,
        address: address,
      };
      setFilters(newFilters);
      setAppliedFilters(newFilters);
    } else {
      setLocationError("Không tìm thấy địa chỉ. Vui lòng thử lại.");
    }

    setIsGettingLocation(false);
  }, []);

  const handleFilterChange = useCallback(
    <K extends keyof FilterValues>(field: K, value: FilterValues[K]) => {
      setFilters((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleApplyFilters = useCallback(async () => {
    // Copy current filters to appliedFilters - this triggers the API call
    setAppliedFilters({ ...filters });

    // Geocode the address to get coordinates and move map
    if (filters.address) {
      const coordinates = await geocodeAddress(filters.address);
      if (coordinates) {
        setMapCenter(coordinates);
        setSearchOrigin(coordinates); // Set as new search origin when applying filter
      }
    }
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setSelectedRoom(null);
    setMapCenter(null);
    setSearchOrigin(null); // Reset search origin too
    setUserLocation(null);
  }, []);

  // Open modal only (from tooltip "Xem chi tiết")
  const handleOpenRoomModal = useCallback((room: RoomFeature) => {
    setModalRoom(room);
    setIsModalOpen(true);
  }, []);

  // Select room on map (highlight marker, used internally by MapView)
  const handleRoomSelect = useCallback((room: RoomFeature) => {
    setSelectedRoom(room);
  }, []);

  // Fly to room and select it (from RoomCard click)
  const handleFlyToRoom = useCallback((room: RoomFeature) => {
    setSelectedRoom(room);
    // Fly to room location
    const [lng, lat] = room.geometry.coordinates;
    setMapCenter([lng, lat]);
  }, []);

  const handleModalOpenChange = useCallback((open: boolean) => {
    setIsModalOpen(open);
  }, []);

  // Handle map bounds change (zoom/drag) - update radius and trigger API call
  const handleMapBoundsChange = useCallback((boundsInfo: MapBoundsInfo) => {
    // Update current radius from map
    setCurrentMapRadius(boundsInfo.radius);

    // Only trigger API refetch if we have applied filters already
    // The queryParams dependency will cause useRooms to refetch automatically
    // when currentMapRadius changes
  }, []);

  // AI Comparison handlers
  const handleAddToComparison = useCallback((room: RoomFeature) => {
    setComparisonRooms((prev) => {
      if (prev.length >= 3) return prev;
      if (prev.some((r) => r.properties.id === room.properties.id)) return prev;
      return [...prev, room];
    });
  }, []);

  const handleRemoveFromComparison = useCallback((roomId: number) => {
    setComparisonRooms((prev) =>
      prev.filter((r) => r.properties.id !== roomId)
    );
  }, []);

  const handleClearComparison = useCallback(() => {
    setComparisonRooms([]);
  }, []);

  // Directions handlers
  const handleShowDirections = useCallback((room: RoomFeature) => {
    setDirectionsRoom(room);
  }, []);

  const handleCloseDirections = useCallback(() => {
    setDirectionsRoom(null);
    setCurrentRoute(null);
    setCustomOrigin(null);
    setIsPickingOrigin(false);
  }, []);

  const handleRouteCalculated = useCallback((route: DirectionsRoute | null) => {
    setCurrentRoute(route);
  }, []);

  const handleRequestPickOrigin = useCallback(() => {
    setIsPickingOrigin(true);
  }, []);

  const handleOriginPicked = useCallback((coords: [number, number]) => {
    setCustomOrigin(coords);
    setIsPickingOrigin(false);
  }, []);

  // Listen for custom event from AIComparisonBox
  useEffect(() => {
    const handleCustomEvent = (e: CustomEvent<RoomFeature>) => {
      handleAddToComparison(e.detail);
    };

    window.addEventListener(
      "addRoomToComparison",
      handleCustomEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        "addRoomToComparison",
        handleCustomEvent as EventListener
      );
    };
  }, [handleAddToComparison]);
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map View - Full screen background */}
      <MapView
        rooms={rooms}
        selectedRoom={selectedRoom}
        onRoomSelect={handleRoomSelect}
        onOpenRoomModal={handleOpenRoomModal}
        onMapBoundsChange={handleMapBoundsChange}
        onShowDirections={handleShowDirections}
        isLoading={isLoading}
        center={mapCenter}
        userLocation={userLocation}
        searchOrigin={searchOrigin}
        route={currentRoute}
        isPickingOrigin={isPickingOrigin}
        onOriginPicked={handleOriginPicked}
        customOrigin={customOrigin}
      />

      {/* Picking Origin Hint */}
      {isPickingOrigin && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-49 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <span>👆 Click vào bản đồ để chọn điểm xuất phát</span>
          <button
            onClick={() => setIsPickingOrigin(false)}
            className="ml-2 hover:bg-emerald-700 rounded-full p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Directions Panel */}
      {directionsRoom && (
        <DirectionsPanel
          room={directionsRoom}
          userLocation={userLocation}
          onClose={handleCloseDirections}
          onRouteCalculated={handleRouteCalculated}
          onRequestPickOrigin={handleRequestPickOrigin}
          customOrigin={customOrigin}
        />
      )}

      {/* Filter Bar - Left side */}
      <FilterBar
        filters={filters}
        isGettingLocation={isGettingLocation}
        locationError={locationError}
        onFilterChange={handleFilterChange}
        onGetCurrentLocation={handleGetCurrentLocation}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Room List Sidebar and Viewings - Right side */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <RoomViewingsSheet />
        <RoomListSidebar
          rooms={rooms}
          selectedRoom={selectedRoom}
          onRoomSelect={handleFlyToRoom}
          isLoading={isLoading}
          error={error}
          onOpenChange={setIsSidebarOpen}
        />
      </div>

      {/* Room Detail Modal */}
      <RoomDetailModal
        room={modalRoom}
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
      />

      {/* Location Prompt - shown when user needs to manually input location */}
      <LocationPrompt
        open={showLocationPrompt && !mapCenter}
        isGettingLocation={isGettingLocation}
        locationError={locationError}
        onRequestGPS={handleGetCurrentLocation}
        onSearchLocation={handleSearchLocation}
        onClose={() => setShowLocationPrompt(false)}
      />

      {/* AI Comparison Box - Bottom Right */}
      <AIComparisonBox
        selectedRooms={comparisonRooms}
        onDrop={handleAddToComparison}
        onRemoveRoom={handleRemoveFromComparison}
        onClearAll={handleClearComparison}
        onViewRoom={handleOpenRoomModal}
        isSidebarOpen={isSidebarOpen}
      />
    </div>
  );
}
