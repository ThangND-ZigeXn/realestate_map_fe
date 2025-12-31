"use client";

import { Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// Dynamic import SearchBox to avoid SSR issues
const SearchBox = dynamic(
  () => import("@mapbox/search-js-react").then((mod) => mod.SearchBox),
  {
    ssr: false,
    loading: () => (
      <Input placeholder="Đang tải..." disabled className="h-10" />
    ),
  }
);

interface AddressSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onGetCurrentLocation: () => void;
  isGettingLocation: boolean;
  placeholder?: string;
}

const AddressSearchBox = ({
  value,
  onChange,
  onGetCurrentLocation,
  isGettingLocation,
  placeholder = "Nhập địa chỉ hoặc sử dụng GPS",
}: AddressSearchBoxProps) => {
  const handleRetrieve = useCallback(
    (result: {
      features: Array<{
        properties: {
          full_address?: string;
          place_formatted?: string;
          name?: string;
        };
      }>;
    }) => {
      if (result.features && result.features.length > 0) {
        const feature = result.features[0];
        const address =
          feature.properties.full_address ||
          feature.properties.place_formatted ||
          feature.properties.name ||
          "";
        onChange(address);
      }
    },
    [onChange]
  );

  return (
    <div className="flex gap-2">
      <div className="flex-1 address-search-box">
        <SearchBox
          accessToken={MAPBOX_TOKEN}
          value={value}
          onChange={(newValue: string) => onChange(newValue)}
          onRetrieve={handleRetrieve}
          placeholder={placeholder}
          options={{
            language: "vi",
            country: "VN",
            limit: 6,
            types: new Set([
              "postcode",
              "place",
              "locality",
              "neighborhood",
              "street",
              "address",
            ] as const),
          }}
          theme={{
            variables: {
              fontFamily: '"Inter", system-ui, sans-serif',
              fontWeight: "400",
              unit: "14px",
              padding: "0.5em",
              borderRadius: "8px",
              boxShadow: "0px 4px 16px 0px rgba(0, 0, 0, 0.12)",
            },
          }}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onGetCurrentLocation}
        disabled={isGettingLocation}
        title="Lấy vị trí hiện tại"
        className="shrink-0 h-10"
      >
        <Navigation
          className={`size-4 ${isGettingLocation ? "animate-spin" : ""}`}
        />
      </Button>
      <style jsx global>{`
        .address-search-box .mapboxgl-ctrl-geocoder {
          width: 100%;
          max-width: 100%;
          min-width: 100%;
        }
        .address-search-box input {
          height: 40px !important;
        }
        .address-search-box .suggestions-wrapper {
          z-index: 1000 !important;
        }
        .address-search-box .suggestions {
          border-radius: 8px !important;
          overflow: hidden;
          border: 1px solid hsl(var(--border)) !important;
          box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.12) !important;
        }
        .address-search-box .suggestion {
          padding: 10px 12px !important;
          font-size: 14px !important;
        }
        .address-search-box .suggestion:hover,
        .address-search-box .suggestion.active {
          background-color: hsl(var(--accent)) !important;
        }
      `}</style>
    </div>
  );
};

export default AddressSearchBox;
