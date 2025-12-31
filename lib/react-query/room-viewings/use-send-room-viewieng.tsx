import { roomViewingsConnect } from "@/lib/api/axios";
import { ApiV1RoomViewingsPostRequest } from "@/lib/api/generated";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useSendRoomViewing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomViewing: ApiV1RoomViewingsPostRequest) => {
      return roomViewingsConnect.apiV1RoomViewingsPost(roomViewing);
    },
    onSuccess: () => {
      // Invalidate room viewings query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["room-viewings"] });
    },
  });
};

export default useSendRoomViewing;
