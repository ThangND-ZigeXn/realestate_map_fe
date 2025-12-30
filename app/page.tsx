"use client";

import { useEffect, useState, useCallback } from "react";

import FilterBar from "@/components/features/FilterBar";
import MapView from "@/components/features/MapView";
import RoomListSidebar from "@/components/features/RoomListSidebar";
import { MOCK_ROOMS } from "@/constants/mockRooms";
import type { FilterValues, Room } from "@/types/room";

export default function Home() {
  const [filters, setFilters] = useState<FilterValues>({
    location: "",
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    roomType: "",
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>(MOCK_ROOMS);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Yêu cầu quyền GPS khi component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setIsGettingLocation(true);
          setLocationError(null);
          console.log(latitude, longitude);

          try {
            // Reverse geocoding để lấy địa chỉ từ tọa độ
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();

            if (data && data.display_name) {
              setFilters((prev) => ({
                ...prev,
                location: data.display_name,
              }));
            } else {
              setFilters((prev) => ({
                ...prev,
                location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              }));
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            setFilters((prev) => ({
              ...prev,
              location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            }));
          } finally {
            setIsGettingLocation(false);
          }
        },
        () => {
          setLocationError("Không thể lấy vị trí. Vui lòng nhập thủ công.");
          setIsGettingLocation(false);
        }
      );
    } else {
      setLocationError("Trình duyệt không hỗ trợ GPS.");
    }
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ GPS.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();

          if (data && data.display_name) {
            setFilters((prev) => ({
              ...prev,
              location: data.display_name,
            }));
          } else {
            setFilters((prev) => ({
              ...prev,
              location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            }));
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          setFilters((prev) => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }));
        } finally {
          setIsGettingLocation(false);
        }
      },
      () => {
        setLocationError("Không thể lấy vị trí. Vui lòng thử lại.");
        setIsGettingLocation(false);
      }
    );
  };

  const handleFilterChange = (field: keyof FilterValues, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    let result = [...rooms];

    // Filter by price range
    if (filters.minPrice) {
      result = result.filter(
        (room) => room.price >= parseInt(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      result = result.filter(
        (room) => room.price <= parseInt(filters.maxPrice)
      );
    }

    // Filter by area range
    if (filters.minArea) {
      result = result.filter((room) => room.area >= parseInt(filters.minArea));
    }
    if (filters.maxArea) {
      result = result.filter((room) => room.area <= parseInt(filters.maxArea));
    }

    // Filter by room type
    if (filters.roomType && filters.roomType !== "all") {
      result = result.filter((room) => room.roomType === filters.roomType);
    }

    // Filter by location (simple text search)
    if (filters.location) {
      const searchTerm = filters.location.toLowerCase();
      result = result.filter(
        (room) =>
          room.address.toLowerCase().includes(searchTerm) ||
          room.title.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredRooms(result);
    console.log("Applied filters:", filters, "Results:", result.length);
  };

  const handleResetFilters = () => {
    setFilters({
      location: "",
      minPrice: "",
      maxPrice: "",
      minArea: "",
      maxArea: "",
      roomType: "",
    });
    setFilteredRooms(rooms);
    setSelectedRoom(null);
  };

  const handleRoomSelect = useCallback((room: Room) => {
    setSelectedRoom(room);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map View - Full screen background */}
      <MapView
        rooms={filteredRooms}
        selectedRoom={selectedRoom}
        onRoomSelect={handleRoomSelect}
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
        rooms={filteredRooms}
        selectedRoom={selectedRoom}
        onRoomSelect={handleRoomSelect}
      />
    </div>
  );
}
