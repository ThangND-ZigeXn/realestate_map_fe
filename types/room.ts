// Filter values for search - matches API params directly
interface FilterValues {
  address?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  roomType?: "room" | "studio" | "apartment" | "";
}

// GeoJSON Feature properties from API
interface RoomProperties {
  id: number;
  title: string;
  price: number;
  area: number | null;
  address: string | null;
  roomType: "room" | "studio" | "apartment";
  status: "available" | "rented";
  description: string | null;
  phone: string | null;
  phoneFormatted: string | null;
}

// GeoJSON Point geometry
interface PointGeometry {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

// GeoJSON Feature from API - This is the main Room type
interface RoomFeature {
  type: "Feature";
  geometry: PointGeometry;
  properties: RoomProperties;
}

// GeoJSON FeatureCollection from API
interface RoomFeatureCollection {
  type: "FeatureCollection";
  features: RoomFeature[];
}

export type {
  FilterValues,
  PointGeometry,
  RoomFeature,
  RoomFeatureCollection,
  RoomProperties,
};
