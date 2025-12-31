"use client";

import {
  Bot,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { analyzeRoomsWithGemini } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import type { AIAnalysisResponse } from "@/types/ai-assistant";
import { roomFeatureToAnalysis } from "@/types/ai-assistant";
import type { RoomFeature } from "@/types/room";

interface AIComparisonBoxProps {
  onDrop: (room: RoomFeature) => void;
  selectedRooms: RoomFeature[];
  onRemoveRoom: (roomId: number) => void;
  onClearAll: () => void;
  onViewRoom?: (room: RoomFeature) => void;
  isSidebarOpen?: boolean;
}

const MAX_SELECTED_ROOMS = 3;

// Sidebar width (sm:max-w-md = 448px)
const SIDEBAR_WIDTH = 448;

export default function AIComparisonBox({
  selectedRooms,
  onRemoveRoom,
  onClearAll,
  onViewRoom,
  isSidebarOpen = false,
}: AIComparisonBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Handle drop - received from parent via custom event
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      // Get room data from dataTransfer
      const roomData = e.dataTransfer.getData("application/json");
      if (!roomData) return;

      try {
        const room: RoomFeature = JSON.parse(roomData);

        // Check if already selected
        if (selectedRooms.some((r) => r.properties.id === room.properties.id)) {
          setError("Phòng này đã được chọn");
          setTimeout(() => setError(null), 2000);
          return;
        }

        // Check max limit
        if (selectedRooms.length >= MAX_SELECTED_ROOMS) {
          setError(`Chỉ có thể chọn tối đa ${MAX_SELECTED_ROOMS} phòng`);
          setTimeout(() => setError(null), 2000);
          return;
        }

        // Dispatch custom event to parent
        window.dispatchEvent(
          new CustomEvent("addRoomToComparison", { detail: room })
        );
        setAnalysisResult(null);
      } catch {
        console.error("Failed to parse room data");
      }
    },
    [selectedRooms]
  );

  // Analyze with AI
  const handleAnalyze = useCallback(async () => {
    if (selectedRooms.length < 2) {
      setError("Cần chọn ít nhất 2 phòng để so sánh");
      setTimeout(() => setError(null), 2000);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const roomsForAnalysis = selectedRooms.map(roomFeatureToAnalysis);
      const result = await analyzeRoomsWithGemini({ rooms: roomsForAnalysis });
      setAnalysisResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi phân tích"
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedRooms]);

  // Clear and reset
  const handleClear = useCallback(() => {
    onClearAll();
    setAnalysisResult(null);
    setError(null);
  }, [onClearAll]);

  return (
    <div
      className={cn(
        "fixed bottom-4 z-[9999] bg-white rounded-xl shadow-2xl border border-slate-200 transition-all duration-300",
        isExpanded ? "h-[50vh] max-h-[600px]" : "h-14"
      )}
      style={{
        // Position: right side, move left when sidebar opens
        right: isSidebarOpen ? `${SIDEBAR_WIDTH + 30}px` : "66px",
        // Width: shrink when sidebar opens
        width: "500px"
      }}
    >
      {/* Header - Always visible */}
      <div
        className={cn(
          "flex items-center justify-between px-4 cursor-pointer h-14",
          isExpanded && "border-b border-slate-200"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-bold text-sm text-slate-800 leading-tight">
              AI So sánh phòng
            </h3>
            {!isExpanded && selectedRooms.length > 0 && (
              <span className="text-xs text-slate-500 leading-tight">
                {selectedRooms.length}/{MAX_SELECTED_ROOMS} phòng đã chọn
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 h-[calc(100%-56px)] overflow-y-auto">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "min-h-[140px] rounded-lg border-2 border-dashed p-4 transition-all duration-200",
              isDragOver
                ? "border-violet-500 bg-violet-50 scale-[1.02]"
                : "border-slate-300 bg-slate-50",
              selectedRooms.length === 0 && "flex items-center justify-center"
            )}
          >
            {selectedRooms.length === 0 ? (
              <div className="text-center">
                <Sparkles className="h-10 w-10 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-600 text-base font-medium">
                  Kéo phòng từ danh sách vào đây
                </p>
                <p className="text-slate-400 text-sm mt-2">Tối đa 3 phòng để so sánh</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedRooms.map((room, index) => (
                  <div
                    key={room.properties.id}
                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200 shadow-sm"
                  >
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0",
                        index === 0
                          ? "bg-amber-500"
                          : index === 1
                          ? "bg-slate-400"
                          : "bg-orange-400"
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {room.properties.title}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatPrice(room.properties.price)} •{" "}
                        {room.properties.area}m²
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRoom(room.properties.id);
                        setAnalysisResult(null);
                      }}
                      className="p-1.5 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ))}

                {/* Placeholder slots */}
                {selectedRooms.length < MAX_SELECTED_ROOMS && (
                  <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center">
                    <p className="text-sm text-slate-400">
                      + Thêm phòng ({MAX_SELECTED_ROOMS - selectedRooms.length}{" "}
                      còn lại)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          {/* Action Buttons */}
          {selectedRooms.length > 0 && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClear}
                className="flex-1 h-10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa tất cả
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={selectedRooms.length < 2 || isAnalyzing}
                className="flex-1 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    So sánh AI
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Analysis Result */}
          {analysisResult && analysisResult.success && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              {/* Best Choice */}
              {(() => {
                const bestRoom = selectedRooms.find(
                  (r) => r.properties.id === analysisResult.analysis.bestChoice.roomId
                );
                return (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                          🏆 Lựa chọn tốt nhất
                        </p>
                        <p className="font-semibold text-slate-800 text-base">
                          {bestRoom?.properties.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-2">
                          {analysisResult.analysis.bestChoice.reason}
                        </p>
                      </div>
                      {bestRoom && onViewRoom && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewRoom(bestRoom)}
                          className="ml-2 flex-shrink-0 bg-white hover:bg-emerald-100 border-emerald-300"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Rankings */}
              <div className="space-y-3">
                {analysisResult.analysis.rankings.map((ranking) => {
                  const room = selectedRooms.find(
                    (r) => r.properties.id === ranking.id
                  );
                  return (
                    <div
                      key={ranking.id}
                      className={cn(
                        "rounded-lg p-3 border",
                        ranking.rank === 1
                          ? "bg-amber-50 border-amber-200"
                          : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                              ranking.rank === 1
                                ? "bg-amber-500"
                                : ranking.rank === 2
                                ? "bg-slate-400"
                                : "bg-orange-400"
                            )}
                          >
                            {ranking.rank}
                          </span>
                          <span className="font-medium text-slate-800 text-sm truncate">
                            {ranking.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-bold text-violet-600 text-sm">
                            {ranking.score}/100
                          </span>
                          {room && onViewRoom && (
                            <button
                              onClick={() => onViewRoom(room)}
                              className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"
                              title="Xem chi tiết phòng"
                            >
                              <Eye className="h-4 w-4 text-slate-600" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Pros/Cons */}
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-emerald-600">
                          ✓ {ranking.pros[0]}
                        </span>
                        <span className="text-red-500">✗ {ranking.cons[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-700">
                  💡 {analysisResult.analysis.comparisonSummary}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

