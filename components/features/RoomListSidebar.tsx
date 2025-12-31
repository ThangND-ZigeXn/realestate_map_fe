"use client";

import { AlertCircle, Building2, Home, Loader2 } from "lucide-react";
import { useState } from "react";

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
import { RoomFeature } from "@/types/room";

import RoomCard from "./RoomCard";

interface RoomListSidebarProps {
  rooms: RoomFeature[];
  selectedRoom: RoomFeature | null;
  onRoomSelect: (room: RoomFeature) => void;
  isLoading?: boolean;
  error?: Error | null;
}

const RoomListSidebar = ({
  rooms,
  selectedRoom,
  onRoomSelect,
  isLoading = false,
  error = null,
}: RoomListSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleRoomCardClick = (room: RoomFeature) => {
    // Call the parent handler to open modal
    onRoomSelect(room);
    // Keep the sheet open - don't close it
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="cursor-pointer absolute top-4 right-4 z-10 gap-2"
        >
          <Building2 className="size-4" />
          <span className="hidden sm:inline">Danh sách</span>
          <Badge variant="secondary" className="ml-1">
            {isLoading ? "..." : rooms.length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Home className="size-5" />
            Danh sách phòng trọ
          </SheetTitle>
          <SheetDescription>
            {isLoading
              ? "Đang tải..."
              : `Tìm thấy ${rooms.length} phòng trọ phù hợp`}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4 space-y-4 pt-0">
            {/* Loading state */}
            {isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="size-12 mx-auto mb-4 animate-spin text-primary" />
                <p>Đang tải danh sách phòng...</p>
              </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
              <div className="text-center py-12 text-destructive">
                <AlertCircle className="size-12 mx-auto mb-4 opacity-70" />
                <p className="font-medium">Có lỗi xảy ra</p>
                <p className="text-sm mt-2 text-muted-foreground">
                  {error.message || "Không thể tải danh sách phòng trọ"}
                </p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && rooms.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="size-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy phòng trọ nào</p>
                <p className="text-sm mt-2">Thử điều chỉnh bộ lọc tìm kiếm</p>
              </div>
            )}

            {/* Room list */}
            {!isLoading &&
              !error &&
              rooms.map((room) => (
                <RoomCard
                  key={room.properties.id}
                  room={room}
                  isSelected={
                    selectedRoom?.properties.id === room.properties.id
                  }
                  onClick={() => handleRoomCardClick(room)}
                />
              ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default RoomListSidebar;
