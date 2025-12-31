"use client";

import { Loader2, MapPin, Navigation, X } from "lucide-react";

import AddressSearchBox from "@/components/features/AddressSearchBox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LocationPromptProps {
  open: boolean;
  isGettingLocation: boolean;
  locationError: string | null;
  onRequestGPS: () => void;
  onSearchLocation: (address: string) => void;
  onClose: () => void;
}

const LocationPrompt = ({
  open,
  isGettingLocation,
  locationError,
  onRequestGPS,
  onSearchLocation,
  onClose,
}: LocationPromptProps) => {
  const handleAddressChange = (address: string) => {
    // When user selects an address from SearchBox, trigger search
    if (address && address.length > 5) {
      // Only auto-search if it looks like a complete address
      // The SearchBox will trigger onRetrieve when user selects from dropdown
    }
  };

  const handleAddressSelect = (address: string) => {
    if (address.trim()) {
      onSearchLocation(address.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* Custom close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          disabled={isGettingLocation}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Đóng</span>
        </button>

        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl text-center">
            Xác định vị trí của bạn
          </DialogTitle>
          <DialogDescription className="text-center">
            Để tìm phòng trọ gần bạn, vui lòng cho phép truy cập vị trí hoặc
            nhập địa chỉ bạn muốn tìm kiếm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* GPS Button */}
          <Button
            onClick={onRequestGPS}
            disabled={isGettingLocation}
            className="w-full h-12 text-base gap-2"
            size="lg"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang xác định vị trí...
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5" />
                Sử dụng vị trí hiện tại
              </>
            )}
          </Button>

          {/* Error message */}
          {locationError && (
            <p className="text-sm text-destructive text-center">
              {locationError}
            </p>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                hoặc tìm kiếm địa chỉ
              </span>
            </div>
          </div>

          {/* Address Search Box */}
          <div className="address-search-container">
            <AddressSearchBox
              value=""
              onChange={handleAddressChange}
              onGetCurrentLocation={onRequestGPS}
              isGettingLocation={isGettingLocation}
              placeholder="Nhập địa chỉ, quận, thành phố..."
              onAddressSelect={handleAddressSelect}
            />
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground text-center">
            Ví dụ: &quot;Quận 1, TP.HCM&quot; hoặc &quot;Cầu Giấy, Hà Nội&quot;
          </p>

          {/* Skip button */}
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isGettingLocation}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Bỏ qua, tôi sẽ tìm kiếm sau
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPrompt;
