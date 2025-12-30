"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROOM_TYPES } from "@/constants/room";
import type { FilterValues } from "@/types/room";
import { MapPin, Menu, Navigation } from "lucide-react";

interface FilterBarProps {
  filters: FilterValues;
  isGettingLocation: boolean;
  locationError: string | null;
  onFilterChange: (field: keyof FilterValues, value: string) => void;
  onGetCurrentLocation: () => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

const FilterBar = ({
  filters,
  isGettingLocation,
  locationError,
  onFilterChange,
  onGetCurrentLocation,
  onApplyFilters,
  onResetFilters,
}: FilterBarProps) => {
  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="cursor-pointer absolute top-4 left-4 z-10"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Bộ lọc tìm kiếm</SheetTitle>
          <SheetDescription>
            Tìm kiếm phòng trọ theo vị trí, giá cả và diện tích
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
          <div className="grid gap-3">
            <Label htmlFor="location">Vị trí</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="location"
                  type="text"
                  placeholder="Nhập địa chỉ hoặc sử dụng GPS"
                  value={filters.location}
                  onChange={(e) => onFilterChange("location", e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onGetCurrentLocation}
                disabled={isGettingLocation}
                title="Lấy vị trí hiện tại"
              >
                <Navigation
                  className={`size-4 ${
                    isGettingLocation ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </div>
            {locationError && (
              <p className="text-sm text-destructive">{locationError}</p>
            )}
          </div>

          {/* Price Range */}
          <div className="grid gap-3">
            <Label>Giá thuê (VNĐ/tháng)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label
                  htmlFor="min-price"
                  className="text-xs text-muted-foreground"
                >
                  Tối thiểu
                </Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => onFilterChange("minPrice", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="max-price"
                  className="text-xs text-muted-foreground"
                >
                  Tối đa
                </Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder="Không giới hạn"
                  value={filters.maxPrice}
                  onChange={(e) => onFilterChange("maxPrice", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Area Range */}
          <div className="grid gap-3">
            <Label>Diện tích (m²)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label
                  htmlFor="min-area"
                  className="text-xs text-muted-foreground"
                >
                  Tối thiểu
                </Label>
                <Input
                  id="min-area"
                  type="number"
                  placeholder="0"
                  value={filters.minArea}
                  onChange={(e) => onFilterChange("minArea", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="max-area"
                  className="text-xs text-muted-foreground"
                >
                  Tối đa
                </Label>
                <Input
                  id="max-area"
                  type="number"
                  placeholder="Không giới hạn"
                  value={filters.maxArea}
                  onChange={(e) => onFilterChange("maxArea", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="room-type">Loại phòng</Label>
            <Select
              value={filters.roomType}
              onValueChange={(value) => onFilterChange("roomType", value)}
            >
              <SelectTrigger id="room-type" className="w-full">
                <SelectValue placeholder="Chọn loại phòng" />
              </SelectTrigger>
              <SelectContent position="popper">
                {ROOM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={onApplyFilters} className="flex-1 sm:w-auto">
            Lọc kết quả
          </Button>
          <Button
            variant="outline"
            onClick={onResetFilters}
            className="flex-1 sm:w-auto"
          >
            Đặt lại
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FilterBar;
