// Mapbox Directions API service

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export interface DirectionsRoute {
  distance: number; // meters
  duration: number; // seconds
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat][]
  };
  legs: {
    summary: string;
    distance: number;
    duration: number;
    steps: {
      maneuver: {
        instruction: string;
        type: string;
      };
      distance: number;
      duration: number;
    }[];
  }[];
}

export interface DirectionsResponse {
  routes: DirectionsRoute[];
  waypoints: {
    name: string;
    location: [number, number];
  }[];
}

export type TravelMode = "driving" | "walking" | "cycling";

/**
 * Get directions from Mapbox API
 * @param origin - [longitude, latitude]
 * @param destination - [longitude, latitude]
 * @param mode - Travel mode: driving, walking, cycling
 */
export async function getDirections(
  origin: [number, number],
  destination: [number, number],
  mode: TravelMode = "driving"
): Promise<DirectionsResponse | null> {
  if (!MAPBOX_TOKEN) {
    console.error("Mapbox token not configured");
    return null;
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}&language=vi`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Directions API error: ${response.status}`);
    }

    const data = await response.json();
    return data as DirectionsResponse;
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  }
  return `${minutes} phút`;
}

/**
 * Get travel mode icon
 */
export function getTravelModeIcon(mode: TravelMode): string {
  switch (mode) {
    case "driving":
      return "🚗";
    case "walking":
      return "🚶";
    case "cycling":
      return "🚴";
    default:
      return "🚗";
  }
}

/**
 * Get travel mode label
 */
export function getTravelModeLabel(mode: TravelMode): string {
  switch (mode) {
    case "driving":
      return "Lái xe";
    case "walking":
      return "Đi bộ";
    case "cycling":
      return "Đạp xe";
    default:
      return "Lái xe";
  }
}

