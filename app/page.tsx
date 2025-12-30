"use client";

import { useEffect, useState } from "react";

import FilterBar from "@/components/features/FilterBar";
import MapView from "@/components/features/MapView";
import type { FilterValues } from "@/types/room";

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
    console.log("Applied filters:", filters);
    // TODO: Implement filter logic
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
  };

  return (
    <div className="relative min-h-screen">
      <FilterBar
        filters={filters}
        isGettingLocation={isGettingLocation}
        locationError={locationError}
        onFilterChange={handleFilterChange}
        onGetCurrentLocation={handleGetCurrentLocation}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
      <MapView />
    </div>
  );
}
