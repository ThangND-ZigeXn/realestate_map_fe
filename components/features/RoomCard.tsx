"use client";

import { GripVertical, ImageIcon, MapPin, Phone, Ruler } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useRoomImage from "@/lib/react-query/room-images/use-room-image";
import { cn } from "@/lib/utils";
import { RoomFeature } from "@/types/room";

interface RoomCardProps {
  room: RoomFeature;
  isSelected: boolean;
  onClick: () => void;
  draggable?: boolean;
}

const RoomCard = ({
  room,
  isSelected,
  onClick,
  draggable = false,
}: RoomCardProps) => {
  const { properties } = room;

  // Fetch room image based on room type
  const { data: imageData, isLoading: isImageLoading } = useRoomImage(
    properties.roomType,
    properties.id
  );

  const getRoomTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      room: "Phòng trọ",
      studio: "Studio",
      apartment: "Căn hộ",
    };
    return types[type] || type;
  };

  const getStatusLabel = (status: string) => {
    return status === "available" ? "Còn trống" : "Đã thuê";
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/json", JSON.stringify(room));
  };

  return (
    <Card
      draggable={draggable}
      onDragStart={handleDragStart}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 pt-0 overflow-hidden",
        isSelected && "border-primary ring-2 ring-primary/20 shadow-md",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
      onClick={onClick}
    >
      {/* Room Image */}
      <div className="relative h-32 w-full bg-muted">
        {isImageLoading ? (
          <Skeleton className="h-full w-full" />
        ) : imageData?.image_url ? (
          <Image
            src={imageData.image_url}
            alt={properties.title}
            fill
            loading="lazy"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <ImageIcon className="size-8 text-muted-foreground" />
          </div>
        )}
        {/* Badges overlay on image */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {draggable && (
            <div className="bg-white/90 rounded p-1">
              <GripVertical className="h-4 w-4 text-slate-400" />
            </div>
          )}
          <Badge
            variant="secondary"
            className="bg-white/90 text-primary border-0 text-xs"
          >
            {getRoomTypeLabel(properties.roomType)}
          </Badge>
          <Badge
            variant={
              properties.status === "available" ? "default" : "secondary"
            }
            className={cn(
              "border-0 text-xs",
              properties.status === "available"
                ? "bg-emerald-500/90 text-white"
                : "bg-gray-500/90 text-white"
            )}
          >
            {getStatusLabel(properties.status)}
          </Badge>
        </div>
        {isSelected && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
            Đang xem
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-base line-clamp-1">
          {properties.title}
        </CardTitle>
        {properties.address && (
          <CardDescription className="flex items-start gap-1.5 text-xs">
            <MapPin className="size-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{properties.address}</span>
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Price and Area */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-emerald-600">
            {properties.price.toLocaleString("vi-VN")} đ
            <span className="text-xs font-normal text-muted-foreground">
              /tháng
            </span>
          </div>
          {properties.area && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
              <Ruler className="size-3.5" />
              {properties.area} m²
            </div>
          )}
        </div>

        {/* Phone - Quick contact */}
        {(properties.phoneFormatted || properties.phone) && (
          <div className="flex items-center justify-end pt-2 border-t text-sm">
            <a
              href={`tel:${properties.phone}`}
              className="flex items-center gap-1.5 text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="size-3.5" />
              <span>{properties.phoneFormatted || properties.phone}</span>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
