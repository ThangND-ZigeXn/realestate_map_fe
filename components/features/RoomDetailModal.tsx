"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarIcon,
  ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Ruler,
  CheckCircle2,
  Info,
  CalendarDays,
} from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import useRoomImage from "@/lib/react-query/room-images/use-room-image";
import useSendRoomViewing from "@/lib/react-query/room-viewings/use-send-room-viewieng";
import { RoomFeature } from "@/types/room";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  preferred_date: Date | undefined;
  message?: string;
}

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
  const [activeTab, setActiveTab] = useState("details");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Fetch room image - always call hook at top level
  const { data: imageData, isLoading: isImageLoading } = useRoomImage(
    room?.properties.roomType || "room",
    room?.properties.id
  );

  // Booking mutation
  const { mutate: sendBooking, isPending: isBooking } = useSendRoomViewing();

  // Form handling
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      preferred_date: undefined,
      message: "",
    },
  });

  const selectedDate = watch("preferred_date");

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

  const onSubmitBooking = (data: BookingFormData) => {
    if (!data.preferred_date) return;

    sendBooking(
      {
        room_id: properties.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        preferred_date: data.preferred_date.toISOString(),
        message: data.message || undefined,
      },
      {
        onSuccess: () => {
          setBookingSuccess(true);
          reset();
        },
        onError: (error) => {
          console.error("Booking error:", error);
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset states when closing
      setActiveTab("details");
      setBookingSuccess(false);
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="gap-2">
              <Info className="size-4" />
              Chi tiết
            </TabsTrigger>
            <TabsTrigger value="booking" className="gap-2">
              <CalendarDays className="size-4" />
              Đặt lịch xem
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 pt-4">
            {/* Room Image */}
            <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted">
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
                  <ImageIcon className="size-12 text-muted-foreground" />
                </div>
              )}
            </div>

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
                  <p className="text-sm text-muted-foreground mb-1">
                    Diện tích
                  </p>
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

            {/* Location Map */}
            <div>
              <h4 className="font-semibold mb-2">Vị trí trên bản đồ</h4>
              <div className="rounded-lg overflow-hidden border relative h-[200px]">
                <Image
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+ef4444(${geometry.coordinates[0]},${geometry.coordinates[1]})/${geometry.coordinates[0]},${geometry.coordinates[1]},15,0/400x200@2x?access_token=${MAPBOX_TOKEN}`}
                  alt="Vị trí phòng trọ"
                  fill
                  loading="lazy"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {geometry.coordinates[1].toFixed(6)},{" "}
                {geometry.coordinates[0].toFixed(6)}
              </p>
            </div>

            {/* Contact Section */}
            {(properties.phoneFormatted || properties.phone) && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Liên hệ</h4>
                <Button asChild className="w-full" size="lg">
                  <a href={`tel:${properties.phone}`}>
                    <Phone className="size-4 mr-2" />
                    {properties.phoneFormatted || properties.phone}
                  </a>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Booking Tab */}
          <TabsContent value="booking" className="pt-4">
            {bookingSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-emerald-100 p-4 mb-4">
                  <CheckCircle2 className="size-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Đặt lịch thành công!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận lịch xem
                  phòng.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setBookingSuccess(false)}
                >
                  Đặt lịch khác
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmitBooking)}
                className="space-y-4"
              >
                {/* Room Info Summary */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">{properties.title}</p>
                  <p className="text-sm text-emerald-600 font-semibold">
                    {properties.price.toLocaleString("vi-VN")} đ/tháng
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Nhập họ và tên"
                    {...register("name", {
                      required: "Vui lòng nhập họ và tên",
                    })}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    {...register("email", {
                      required: "Vui lòng nhập email",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Email không hợp lệ",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Số điện thoại <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0901234567"
                    {...register("phone", {
                      required: "Vui lòng nhập số điện thoại",
                      pattern: {
                        value: /^[0-9]{10,11}$/,
                        message: "Số điện thoại không hợp lệ (10-11 số)",
                      },
                    })}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Preferred Date */}
                <div className="space-y-2">
                  <Label>
                    Ngày muốn xem <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "EEEE, dd/MM/yyyy", {
                            locale: vi,
                          })
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setValue("preferred_date", date);
                          setIsDatePickerOpen(false); // Close popover after selecting
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>
                  {!selectedDate && errors.preferred_date && (
                    <p className="text-sm text-destructive">
                      Vui lòng chọn ngày xem phòng
                    </p>
                  )}
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Lời nhắn (không bắt buộc)</Label>
                  <Textarea
                    id="message"
                    placeholder="Ví dụ: Tôi muốn xem phòng vào buổi chiều..."
                    rows={3}
                    {...register("message")}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isBooking || !selectedDate}
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Đặt lịch xem phòng
                    </>
                  )}
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailModal;
