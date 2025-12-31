import type { RoomFeature } from "./room";

// Room data format for AI analysis
interface RoomForAnalysis {
  id: number;
  title: string;
  price: number;
  area: number | null;
  address: string | null;
  roomType: "room" | "studio" | "apartment";
  description: string | null;
  amenities?: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Request body to send to BE/Gemini
interface AIAnalysisRequest {
  rooms: RoomForAnalysis[];
  userPreferences?: {
    budget?: number;
    preferredArea?: number;
    priorityFactors?: ("price" | "area" | "location" | "amenities")[];
  };
}

// Single room analysis result
interface RoomAnalysisResult {
  id: number;
  title: string;
  rank: number;
  score: number; // 0-100
  priceScore: number;
  areaScore: number;
  locationScore: number;
  amenitiesScore: number;
  pros: string[];
  cons: string[];
  recommendation: string;
}

// Complete AI analysis response
interface AIAnalysisResponse {
  success: boolean;
  analysis: {
    rankings: RoomAnalysisResult[];
    bestChoice: {
      roomId: number;
      reason: string;
    };
    comparisonSummary: string;
    tips: string[];
  };
  generatedAt: string;
}

// Drag and drop state
interface DragState {
  isDragging: boolean;
  draggedRoom: RoomFeature | null;
}

// Selected rooms for comparison (max 3)
interface SelectedRoomsState {
  rooms: RoomFeature[];
  maxRooms: 3;
}

// AI Assistant UI state
interface AIAssistantState {
  isOpen: boolean;
  isAnalyzing: boolean;
  selectedRooms: RoomFeature[];
  analysisResult: AIAnalysisResponse | null;
  error: string | null;
}

// Convert RoomFeature to RoomForAnalysis
function roomFeatureToAnalysis(room: RoomFeature): RoomForAnalysis {
  return {
    id: room.properties.id,
    title: room.properties.title,
    price: room.properties.price,
    area: room.properties.area,
    address: room.properties.address,
    roomType: room.properties.roomType,
    description: room.properties.description,
    coordinates: {
      longitude: room.geometry.coordinates[0],
      latitude: room.geometry.coordinates[1],
    },
  };
}

export type {
  AIAnalysisRequest,
  AIAnalysisResponse,
  AIAssistantState,
  DragState,
  RoomAnalysisResult,
  RoomForAnalysis,
  SelectedRoomsState,
};

export { roomFeatureToAnalysis };

