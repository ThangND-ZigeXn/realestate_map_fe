import { roomImagesConnect } from "@/lib/api/axios";
import { useQuery } from "@tanstack/react-query";

type RoomType = "room" | "studio" | "apartment";

/**
 * Hook to fetch a random room image by room type
 * @param type - Room type (room, studio, apartment)
 * @param roomId - Optional room ID for unique caching per room
 */
const useRoomImage = (type: RoomType, roomId?: number) => {
  return useQuery({
    // Include roomId in queryKey to cache different images for different rooms
    queryKey: ["room-image", type, roomId],
    queryFn: async () => {
      const response = await roomImagesConnect.apiV1RoomImagesRandomGet(type);
      return response.data;
    },
    // Cache image for 30 minutes since it's random and we don't want to refetch often
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

export default useRoomImage;
