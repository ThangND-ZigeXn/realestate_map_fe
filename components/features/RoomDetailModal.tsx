"use client";

import { MapPin, Phone, Ruler, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomFeature } from "@/types/room";

interface RoomDetailModalProps {
  room: RoomFeature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoomDetailModal = ({
  room,
  open,
  onOpenChange,
}: RoomDetailModalProps) => {
  if (!room) return null;

  const { properties, geometry } = room;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
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
          </div>
          <DialogTitle className="text-xl font-bold pr-8">
            {properties.title}
          </DialogTitle>
          {properties.address && (
            <DialogDescription className="flex items-start gap-2 text-sm">
              <MapPin className="size-4 shrink-0 mt-0.5" />
              <span>{properties.address}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Price and Area Section */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Giá thuê</p>
              <p className="text-2xl font-bold text-emerald-600">
                {properties.price.toLocaleString("vi-VN")} đ
                <span className="text-sm font-normal text-muted-foreground">
                  /tháng
                </span>
              </p>
            </div>
            {properties.area && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Diện tích</p>
                <div className="flex items-center gap-1.5 text-lg font-semibold">
                  <Ruler className="size-5" />
                  {properties.area} m²
                </div>
              </div>
            )}
          </div>

          {/* Description Section */}
          {properties.description && (
            <div>
              <h4 className="font-semibold mb-2">Mô tả</h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {properties.description}
              </p>
            </div>
          )}

          {/* Location Coordinates */}
          <div>
            <h4 className="font-semibold mb-2">Tọa độ</h4>
            <p className="text-sm text-muted-foreground">
              Kinh độ: {geometry.coordinates[0].toFixed(6)}
              <br />
              Vĩ độ: {geometry.coordinates[1].toFixed(6)}
            </p>
          </div>

          {/* Contact Section */}
          {(properties.phoneFormatted || properties.phone) && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3">Liên hệ</h4>
              <Button
                asChild
                className="w-full"
                size="lg"
              >
                <a href={`tel:${properties.phone}`}>
                  <Phone className="size-4 mr-2" />
                  {properties.phoneFormatted || properties.phone}
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailModal;

