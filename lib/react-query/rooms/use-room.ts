import { roomConnect } from "@/lib/api/axios";
import { RoomFeature, RoomFeatureCollection } from "@/types/room";
import { useQuery } from "@tanstack/react-query";

// Mock data - uncomment when API is not available
// import { MOCK_ROOMS_GEOJSON } from "@/constants/mockRoomsGeoJSON";

interface UseRoomsParams {
  address?: string;
  addressRadius?: number;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  roomType?: "room" | "studio" | "apartment";
  status?: "available" | "rented";
}

interface UseRoomsOptions {
  enabled?: boolean;
}

export const useRooms = (
  params?: UseRoomsParams,
  options?: UseRoomsOptions
) => {
  return useQuery({
    queryKey: ["rooms", params],
    queryFn: async (): Promise<RoomFeature[]> => {
      // Call real API
      const response = await roomConnect.apiV1RoomsGet(
        params?.address,
        params?.addressRadius,
        params?.north,
        params?.south,
        params?.east,
        params?.west,
        params?.lat,
        params?.lng,
        params?.radius,
        params?.minPrice,
        params?.maxPrice,
        params?.minArea,
        params?.maxArea,
        params?.roomType,
        params?.status
      );

      const data = response.data as RoomFeatureCollection;

      if (!data.features || !Array.isArray(data.features)) {
        return [];
      }

      return data.features;

      // Mock data - uncomment when API is not available
      // let features = MOCK_ROOMS_GEOJSON.features;
      //
      // // Apply filters on mock data
      // if (params?.minPrice) {
      //   features = features.filter((f) => f.properties.price >= params.minPrice!);
      // }
      // if (params?.maxPrice) {
      //   features = features.filter((f) => f.properties.price <= params.maxPrice!);
      // }
      // if (params?.minArea) {
      //   features = features.filter(
      //     (f) => (f.properties.area || 0) >= params.minArea!
      //   );
      // }
      // if (params?.maxArea) {
      //   features = features.filter(
      //     (f) => (f.properties.area || 0) <= params.maxArea!
      //   );
      // }
      // if (params?.roomType) {
      //   features = features.filter(
      //     (f) => f.properties.roomType === params.roomType
      //   );
      // }
      // if (params?.status) {
      //   features = features.filter((f) => f.properties.status === params.status);
      // }
      //
      // return features;
    },
    enabled: options?.enabled ?? true,
  });
};
