"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Room } from "@/types/room";
import { MapPin, Phone, Ruler, User } from "lucide-react";

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  onClick: () => void;
}

const RoomCard = ({ room, isSelected, onClick }: RoomCardProps) => {
  const getRoomTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      studio: "Studio",
      "1-bedroom": "1 PN",
      "2-bedroom": "2 PN",
      "3-bedroom": "3 PN",
      "4+bedroom": "4+ PN",
    };
    return types[type] || type;
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 pt-0 ${
        isSelected ? "border-primary ring-2 ring-primary/20 shadow-md" : ""
      }`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-t-xl">
        <img
          src={room.images[0]}
          alt={room.title}
          className="w-full h-40 object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400";
          }}
        />
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm"
        >
          {getRoomTypeLabel(room.roomType)}
        </Badge>
        {isSelected && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
            Đang xem
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-1">{room.title}</CardTitle>
        <CardDescription className="flex items-start gap-1.5 text-xs">
          <MapPin className="size-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{room.address}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Price and Area */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-emerald-600">
            {room.price.toLocaleString("vi-VN")} đ
            <span className="text-xs font-normal text-muted-foreground">
              /tháng
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
            <Ruler className="size-3.5" />
            {room.area} m²
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5">
          {room.amenities.slice(0, 4).map((amenity, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {room.amenities.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{room.amenities.length - 4}
            </Badge>
          )}
        </div>

        {/* Landlord info */}
        <div className="flex items-center justify-between pt-2 border-t text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="size-3.5" />
            <span className="truncate max-w-[100px]">{room.landlord.name}</span>
          </div>
          <a
            href={`tel:${room.landlord.phone}`}
            className="flex items-center gap-1.5 text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="size-3.5" />
            <span>{room.landlord.phone}</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomCard;

