"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import FilterBar from "@/components/features/FilterBar";
import MapView from "@/components/features/MapView";
import RoomDetailModal from "@/components/features/RoomDetailModal";
import RoomListSidebar from "@/components/features/RoomListSidebar";
import { useRooms } from "@/lib/react-query/rooms/use-room";
import type { FilterValues, RoomFeature } from "@/types/room";

const INITIAL_FILTERS: FilterValues = {
  address: "",
  minPrice: undefined,
  maxPrice: undefined,
  minArea: undefined,
  maxArea: undefined,
  roomType: "",
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// Default center (Ho Chi Minh City)
const DEFAULT_CENTER: [number, number] = [106.700806, 10.773884];

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
  // Track if initial API call has been made
  const hasInitialLoad = useRef(false);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomFeature | null>(null);

  // Map center coordinates [longitude, latitude]
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // User's current GPS location [longitude, latitude]
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  // Room detail modal state
  const [modalRoom, setModalRoom] = useState<RoomFeature | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Build query params from appliedFilters - filter out empty/undefined values
  const queryParams =
    appliedFilters === null
      ? undefined
      : {
          address: appliedFilters.address || undefined,
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

  // Yêu cầu quyền GPS khi component mount và gọi API ban đầu
  useEffect(() => {
    if (hasInitialLoad.current) return;
    hasInitialLoad.current = true;

    const initLocation = async () => {
      if (!navigator.geolocation) {
        // GPS not supported - call API with empty location
        setLocationError("Trình duyệt không hỗ trợ GPS.");
        setAppliedFilters(INITIAL_FILTERS);
        return;
      }

      setIsGettingLocation(true);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocationError(null);
          console.log("User location:", latitude, longitude);

          // Set map center and user location marker
          setMapCenter([longitude, latitude]);
          setUserLocation([longitude, latitude]);

          // Use Mapbox Geocoding API for reverse geocoding
          const locationAddress = await reverseGeocode(latitude, longitude);

          // Update both filters and appliedFilters, then call API
          const newFilters: FilterValues = {
            ...INITIAL_FILTERS,
            address: locationAddress,
          };
          setFilters(newFilters);
          setAppliedFilters(newFilters);
          setIsGettingLocation(false);
        },
        () => {
          // GPS denied or failed - call API with empty location
          setLocationError("Không thể lấy vị trí. Vui lòng nhập thủ công.");
          setIsGettingLocation(false);
          setAppliedFilters(INITIAL_FILTERS);
        }
      );
    };

    initLocation();
  }, []);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ GPS.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Set map center and user location marker
        setMapCenter([longitude, latitude]);
        setUserLocation([longitude, latitude]);

        // Use Mapbox Geocoding API for reverse geocoding
        const locationAddress = await reverseGeocode(latitude, longitude);

        setFilters((prev) => ({
          ...prev,
          address: locationAddress,
        }));
        setIsGettingLocation(false);
      },
      () => {
        setLocationError("Không thể lấy vị trí. Vui lòng thử lại.");
        setIsGettingLocation(false);
      }
    );
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
    console.log("Applied filters:", filters);

    // Geocode the address to get coordinates and move map
    if (filters.address) {
      const coordinates = await geocodeAddress(filters.address);
      if (coordinates) {
        setMapCenter(coordinates);
      }
    }
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setSelectedRoom(null);
    setMapCenter(DEFAULT_CENTER);
    setUserLocation(null);
  }, []);

  // Open modal only (from RoomCard click or tooltip "Xem chi tiết")
  const handleOpenRoomModal = useCallback((room: RoomFeature) => {
    setModalRoom(room);
    setIsModalOpen(true);
  }, []);

  // Select room on map (highlight marker, used internally by MapView)
  const handleRoomSelect = useCallback((room: RoomFeature) => {
    setSelectedRoom(room);
  }, []);

  const handleModalOpenChange = useCallback((open: boolean) => {
    setIsModalOpen(open);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map View - Full screen background */}
      <MapView
        rooms={rooms}
        selectedRoom={selectedRoom}
        onRoomSelect={handleRoomSelect}
        onOpenRoomModal={handleOpenRoomModal}
        isLoading={isLoading}
        center={mapCenter}
        userLocation={userLocation}
      />

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

      {/* Room List Sidebar - Right side */}
      <RoomListSidebar
        rooms={rooms}
        selectedRoom={selectedRoom}
        onRoomSelect={handleOpenRoomModal}
        isLoading={isLoading}
        error={error}
      />

      {/* Room Detail Modal */}
      <RoomDetailModal
        room={modalRoom}
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
      />
    </div>
  );
}
