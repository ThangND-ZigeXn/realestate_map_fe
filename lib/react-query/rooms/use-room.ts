import { roomConnect } from "@/lib/api/axios";
import { useQuery } from "@tanstack/react-query";

export const useRooms = () => {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomConnect.apiV1RoomsGet(),
  });
};
