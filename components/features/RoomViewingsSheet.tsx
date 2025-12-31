"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Ruler,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiV1RoomViewingsGet200ResponseDataInner } from "@/lib/api/generated";
import useRoomViewings from "@/lib/react-query/room-viewings/use-room-viewings";
import useRoomDetail from "@/lib/react-query/rooms/use-room-detail";

// Component to display a single viewing card with room details
const ViewingCard = ({
  viewing,
}: {
  viewing: ApiV1RoomViewingsGet200ResponseDataInner;
}) => {
  const { data: roomData, isLoading: isRoomLoading } = useRoomDetail(
    viewing.room_id || 0
  );

  const room = roomData?.properties;

  return (
    <Card className="overflow-hidden gap-1">
      <CardHeader className="pb-2">
        {isRoomLoading ? (
          <>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : (
          <>
            <CardTitle className="text-base line-clamp-1">
              {room?.title || `Phòng #${viewing.room_id}`}
            </CardTitle>
            {room?.address && (
              <CardDescription className="flex items-start gap-1.5 mt-1">
                <MapPin className="size-3.5 shrink-0 mt-0.5" />
                <span>{room.address}</span>
              </CardDescription>
            )}
          </>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Room Info */}
        {!isRoomLoading && room && (
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
            <span className="text-sm font-semibold text-emerald-600">
              {room.price?.toLocaleString("vi-VN")} đ/tháng
            </span>
            {room.area && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Ruler className="size-3" />
                {room.area} m²
              </span>
            )}
          </div>
        )}

        {/* Viewing Date */}
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Clock className="size-4" />
          <span>
            {viewing.preferred_date
              ? format(new Date(viewing.preferred_date), "EEEE, dd/MM/yyyy", {
                  locale: vi,
                })
              : "Chưa xác định ngày"}
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-sm border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Thông tin liên hệ
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4 shrink-0" />
            <span className="truncate">{viewing.name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-4 shrink-0" />
            <a
              href={`tel:${viewing.phone}`}
              className="text-primary hover:underline"
            >
              {viewing.phone}
            </a>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-4 shrink-0" />
            <a
              href={`mailto:${viewing.email}`}
              className="text-primary hover:underline truncate"
            >
              {viewing.email}
            </a>
          </div>
        </div>

        {/* Message */}
        {viewing.message && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2 text-sm">
              <MessageSquare className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-muted-foreground italic">{viewing.message}</p>
            </div>
          </div>
        )}

        {/* Created date */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Đặt lịch lúc:{" "}
            {viewing.created_at
              ? format(new Date(viewing.created_at), "HH:mm - dd/MM/yyyy", {
                  locale: vi,
                })
              : "Không xác định"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

interface RoomViewingsSheetProps {
  trigger?: React.ReactNode;
}

const RoomViewingsSheet = ({ trigger }: RoomViewingsSheetProps) => {
  const { data: viewingsData, isLoading, error } = useRoomViewings();

  // Sort viewings by preferred_date (soonest first - ascending order)
  const viewings = [...(viewingsData?.data || [])].sort((a, b) => {
    const dateA = a.preferred_date
      ? new Date(a.preferred_date).getTime()
      : Infinity;
    const dateB = b.preferred_date
      ? new Date(b.preferred_date).getTime()
      : Infinity;
    return dateA - dateB;
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <CalendarCheck className="size-4" />
            <span className="hidden sm:inline">Lịch xem</span>
            <Badge variant="secondary" className="ml-1">
              {isLoading ? "..." : viewings.length}
            </Badge>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            Lịch xem phòng
          </SheetTitle>
          <SheetDescription>
            Danh sách các lịch hẹn xem phòng của bạn
          </SheetDescription>
        </SheetHeader>

        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="size-12 text-destructive mb-4" />
              <p className="text-sm text-destructive">
                Có lỗi xảy ra khi tải danh sách lịch xem phòng.
              </p>
            </div>
          ) : viewings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="size-12 text-muted-foreground mb-4" />
              <p className="font-medium">Chưa có lịch xem phòng</p>
              <p className="text-sm text-muted-foreground mt-1">
                Bạn có thể đặt lịch xem phòng từ chi tiết phòng.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-100px)] px-4">
              <div className="space-y-4 pb-4">
                {viewings.map((viewing) => (
                  <ViewingCard key={viewing.id} viewing={viewing} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RoomViewingsSheet;
