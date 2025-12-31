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
import { Menu } from "lucide-react";

import AddressSearchBox from "./AddressSearchBox";

// Format number with dots as thousands separator (e.g., 5000000 -> "5.000.000")
const formatPrice = (value: number | undefined): string => {
  if (value === undefined || value === null) return "";
  return value.toLocaleString("vi-VN");
};

// Parse formatted price string back to number (e.g., "5.000.000" -> 5000000)
const parsePrice = (value: string): number | undefined => {
  if (value === "") return undefined;
  // Remove all dots (thousands separator)
  const cleanValue = value.replace(/\./g, "");
  const numValue = parseInt(cleanValue, 10);
  return isNaN(numValue) ? undefined : numValue;
};

interface FilterBarProps {
  filters: FilterValues;
  isGettingLocation: boolean;
  locationError: string | null;
  onFilterChange: <K extends keyof FilterValues>(
    field: K,
    value: FilterValues[K]
  ) => void;
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
  // Handle price input change - parse formatted string to number
  const handlePriceChange = (
    field: "minPrice" | "maxPrice",
    value: string
  ) => {
    const numValue = parsePrice(value);
    onFilterChange(field, numValue);
  };

  // Handle area input change (no formatting needed)
  const handleAreaChange = (
    field: "minArea" | "maxArea",
    value: string
  ) => {
    const numValue = value === "" ? undefined : parseInt(value, 10);
    onFilterChange(field, isNaN(numValue as number) ? undefined : numValue);
  };

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
            <AddressSearchBox
              value={filters.address || ""}
              onChange={(value) => onFilterChange("address", value)}
              onGetCurrentLocation={onGetCurrentLocation}
              isGettingLocation={isGettingLocation}
            />
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
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatPrice(filters.minPrice)}
                  onChange={(e) =>
                    handlePriceChange("minPrice", e.target.value)
                  }
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
                  type="text"
                  inputMode="numeric"
                  placeholder="Không giới hạn"
                  value={formatPrice(filters.maxPrice)}
                  onChange={(e) =>
                    handlePriceChange("maxPrice", e.target.value)
                  }
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
                  min={0}
                  max={1000}
                  value={filters.minArea ?? ""}
                  onChange={(e) =>
                    handleAreaChange("minArea", e.target.value)
                  }
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
                  min={0}
                  max={1000}
                  value={filters.maxArea ?? ""}
                  onChange={(e) =>
                    handleAreaChange("maxArea", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="room-type">Loại phòng</Label>
            <Select
              value={filters.roomType || ""}
              onValueChange={(value) =>
                onFilterChange("roomType", value as FilterValues["roomType"])
              }
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
