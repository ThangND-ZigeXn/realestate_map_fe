import { roomConnect } from "@/lib/api/axios";
import { useQuery } from "@tanstack/react-query";

const useRoomDetail = (roomId: number) => {
  return useQuery({
    queryKey: ["rooms", roomId],
    queryFn: async () => {
      const response = await roomConnect.apiV1RoomsIdGet(roomId);
      return response.data;
    },
  });
};

export default useRoomDetail;
