"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Room } from "@/types/room";
import { Building2, Home } from "lucide-react";
import RoomCard from "./RoomCard";

interface RoomListSidebarProps {
  rooms: Room[];
  selectedRoom: Room | null;
  onRoomSelect: (room: Room) => void;
}

const RoomListSidebar = ({
  rooms,
  selectedRoom,
  onRoomSelect,
}: RoomListSidebarProps) => {
  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="cursor-pointer absolute top-4 right-4 z-10 gap-2"
        >
          <Building2 className="size-4" />
          <span className="hidden sm:inline">Danh sách</span>
          <Badge variant="secondary" className="ml-1">
            {rooms.length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Home className="size-5" />
            Danh sách phòng trọ
          </SheetTitle>
          <SheetDescription>
            Tìm thấy {rooms.length} phòng trọ phù hợp
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4 space-y-4 pt-0">
            {rooms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="size-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy phòng trọ nào</p>
                <p className="text-sm mt-2">Thử điều chỉnh bộ lọc tìm kiếm</p>
              </div>
            ) : (
              rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isSelected={selectedRoom?.id === room.id}
                  onClick={() => onRoomSelect(room)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default RoomListSidebar;
