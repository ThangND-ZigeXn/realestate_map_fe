import { roomViewingsConnect } from "@/lib/api/axios";
import { useQuery } from "@tanstack/react-query";

const useRoomViewings = () => {
  return useQuery({
    queryKey: ["room-viewings"],
    queryFn: async () => {
      const response = await roomViewingsConnect.apiV1RoomViewingsGet();
      return response.data;
    },
  });
};

export default useRoomViewings;
