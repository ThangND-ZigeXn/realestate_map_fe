"use client";

import {
  Bike,
  Car,
  Crosshair,
  Footprints,
  Loader2,
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  formatDistance,
  formatDuration,
  getDirections,
  type DirectionsRoute,
  type TravelMode,
} from "@/lib/mapbox-directions";
import { cn } from "@/lib/utils";
import type { RoomFeature } from "@/types/room";

interface DirectionsPanelProps {
  room: RoomFeature | null;
  userLocation: [number, number] | null;
  onClose: () => void;
  onRouteCalculated: (route: DirectionsRoute | null) => void;
  onRequestPickOrigin?: () => void;
  customOrigin?: [number, number] | null;
}

export default function DirectionsPanel({
  room,
  userLocation,
  onClose,
  onRouteCalculated,
  onRequestPickOrigin,
  customOrigin,
}: DirectionsPanelProps) {
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [route, setRoute] = useState<DirectionsRoute | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use custom origin if available, otherwise use user location
  const origin = customOrigin || userLocation;

  // Calculate directions
  const calculateDirections = useCallback(async () => {
    if (!room || !origin) return;

    setIsLoading(true);
    setError(null);

    try {
      const destination: [number, number] = [
        room.geometry.coordinates[0],
        room.geometry.coordinates[1],
      ];

      const result = await getDirections(origin, destination, travelMode);

      if (result && result.routes.length > 0) {
        setRoute(result.routes[0]);
        onRouteCalculated(result.routes[0]);
      } else {
        setError("Không tìm thấy đường đi");
        onRouteCalculated(null);
      }
    } catch {
      setError("Lỗi khi tính đường đi");
      onRouteCalculated(null);
    } finally {
      setIsLoading(false);
    }
  }, [room, origin, travelMode, onRouteCalculated]);

  // Recalculate when travel mode or origin changes
  useEffect(() => {
    if (room && origin) {
      calculateDirections();
    }
  }, [room, origin, travelMode, calculateDirections]);

  // Clear route when panel closes
  const handleClose = useCallback(() => {
    onRouteCalculated(null);
    onClose();
  }, [onClose, onRouteCalculated]);

  if (!room) return null;

  return (
    <div className="fixed top-20 left-4 z-49 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          <span className="font-semibold">Chỉ đường</span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Destination info */}
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500 mb-1">Điểm đến:</p>
        <p className="font-medium text-slate-800 text-sm line-clamp-1">
          {room.properties.title}
        </p>
        <p className="text-xs text-slate-500 line-clamp-1">
          {room.properties.address}
        </p>
      </div>

      {/* Origin info */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-500">Điểm xuất phát:</p>
          <Button
            size="sm"
            variant="outline"
            onClick={onRequestPickOrigin}
            className="h-7 text-xs gap-1"
          >
            <MapPin className="h-3 w-3" />
            Chọn trên bản đồ
          </Button>
        </div>
        {customOrigin ? (
          <p className="font-medium text-slate-800 text-sm flex items-center gap-1">
            <Crosshair className="h-3 w-3 text-emerald-500" />
            Điểm đã chọn trên bản đồ
          </p>
        ) : userLocation ? (
          <p className="font-medium text-slate-800 text-sm flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Vị trí GPS hiện tại
          </p>
        ) : (
          <p className="text-amber-600 text-sm">
            👆 Click &quot;Chọn trên bản đồ&quot; để chỉ định điểm xuất phát
          </p>
        )}
      </div>

      {/* Travel mode selector */}
      <div className="p-3 border-b border-slate-200">
        <p className="text-xs text-slate-500 mb-2">Phương tiện:</p>
        <div className="flex gap-2">
          <button
            onClick={() => setTravelMode("driving")}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
              travelMode === "driving"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Car className="h-5 w-5" />
            <span className="text-xs">Lái xe</span>
          </button>
          <button
            onClick={() => setTravelMode("cycling")}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
              travelMode === "cycling"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Bike className="h-5 w-5" />
            <span className="text-xs">Đạp xe</span>
          </button>
          <button
            onClick={() => setTravelMode("walking")}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
              travelMode === "walking"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Footprints className="h-5 w-5" />
            <span className="text-xs">Đi bộ</span>
          </button>
        </div>
      </div>

      {/* Route info */}
      <div className="p-3">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Đang tính đường đi...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-red-500 text-sm">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={calculateDirections}
              className="mt-2"
            >
              Thử lại
            </Button>
          </div>
        )}

        {!isLoading && !error && route && (
          <div className="space-y-3">
            {/* Distance & Duration */}
            <div className="flex items-center justify-center gap-6 py-3 bg-slate-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatDistance(route.distance)}
                </p>
                <p className="text-xs text-slate-500">Khoảng cách</p>
              </div>
              <div className="w-px h-10 bg-slate-300"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {formatDuration(route.duration)}
                </p>
                <p className="text-xs text-slate-500">Thời gian</p>
              </div>
            </div>

            {/* Route summary */}
            {route.legs[0]?.summary && (
              <p className="text-xs text-slate-500 text-center">
                Đi qua: {route.legs[0].summary}
              </p>
            )}
          </div>
        )}

        {!isLoading && !error && !route && !origin && (
          <div className="text-center py-4">
            <p className="text-slate-500 text-sm mb-2">
              Chọn điểm xuất phát để xem đường đi
            </p>
            <Button size="sm" onClick={onRequestPickOrigin} className="gap-1">
              <MapPin className="h-4 w-4" />
              Chọn trên bản đồ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
