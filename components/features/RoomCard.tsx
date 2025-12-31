"use client";

import { MapPin, Phone, Ruler } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoomFeature } from "@/types/room";

interface RoomCardProps {
  room: RoomFeature;
  isSelected: boolean;
  onClick: () => void;
}

const RoomCard = ({ room, isSelected, onClick }: RoomCardProps) => {
  const { properties } = room;

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

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 pt-0 ${
        isSelected ? "border-primary ring-2 ring-primary/20 shadow-md" : ""
      }`}
      onClick={onClick}
    >
      {/* Header with badges */}
      <div className="relative p-3 pb-0">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-0"
          >
            {getRoomTypeLabel(properties.roomType)}
          </Badge>
          <Badge
            variant={
              properties.status === "available" ? "default" : "secondary"
            }
            className={
              properties.status === "available"
                ? "bg-emerald-100 text-emerald-700 border-0"
                : "bg-gray-100 text-gray-600 border-0"
            }
          >
            {getStatusLabel(properties.status)}
          </Badge>
          {isSelected && (
            <Badge className="ml-auto bg-primary text-primary-foreground">
              Đang xem
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-2">
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
