"use client";

import { Bot, GripVertical, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { analyzeRoomsWithGemini } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import type { AIAnalysisResponse } from "@/types/ai-assistant";
import { roomFeatureToAnalysis } from "@/types/ai-assistant";
import type { RoomFeature } from "@/types/room";

interface AIAssistantProps {
  rooms: RoomFeature[];
}

const MAX_SELECTED_ROOMS = 3;

export default function AIAssistant({ rooms }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<RoomFeature[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggedRoom, setDraggedRoom] = useState<RoomFeature | null>(null);

  // Format price to Vietnamese currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ/tháng";
  };

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.DragEvent, room: RoomFeature) => {
      setDraggedRoom(room);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", room.properties.id.toString());
    },
    []
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedRoom(null);
  }, []);

  // Handle drag over drop zone
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop on drop zone
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedRoom) return;

      // Check if room is already selected
      if (
        selectedRooms.some((r) => r.properties.id === draggedRoom.properties.id)
      ) {
        return;
      }

      // Check max limit
      if (selectedRooms.length >= MAX_SELECTED_ROOMS) {
        setError(`Chỉ có thể chọn tối đa ${MAX_SELECTED_ROOMS} phòng`);
        setTimeout(() => setError(null), 3000);
        return;
      }

      setSelectedRooms((prev) => [...prev, draggedRoom]);
      setDraggedRoom(null);
      setAnalysisResult(null);
    },
    [draggedRoom, selectedRooms]
  );

  // Remove room from selected
  const handleRemoveRoom = useCallback((roomId: number) => {
    setSelectedRooms((prev) => prev.filter((r) => r.properties.id !== roomId));
    setAnalysisResult(null);
  }, []);

  // Clear all selected rooms
  const handleClearAll = useCallback(() => {
    setSelectedRooms([]);
    setAnalysisResult(null);
    setError(null);
  }, []);

  // Analyze rooms with AI
  const handleAnalyze = useCallback(async () => {
    if (selectedRooms.length < 2) {
      setError("Cần chọn ít nhất 2 phòng để so sánh");
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

  // Available rooms (not selected)
  const availableRooms = rooms.filter(
    (room) => !selectedRooms.some((s) => s.properties.id === room.properties.id)
  );

  return (
    <>
      {/* Floating Button - Bottom Left */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 left-6 z-49 h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl transition-all duration-300"
          >
            <Bot className="h-6 w-6 text-white" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-full sm:max-w-lg overflow-y-auto bg-slate-50 z-49"
        >
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-violet-700">
              <Sparkles className="h-5 w-5" />
              AI Tư Vấn Phòng Trọ
            </SheetTitle>
            <SheetDescription>
              Kéo thả 2-3 phòng để AI phân tích và đề xuất lựa chọn tốt nhất
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Drop Zone - Selected Rooms */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Phòng đã chọn ({selectedRooms.length}/{MAX_SELECTED_ROOMS})
              </h3>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  "min-h-[140px] rounded-xl border-2 border-dashed p-4 transition-all duration-200",
                  draggedRoom
                    ? "border-violet-500 bg-violet-50"
                    : "border-slate-300 bg-white",
                  selectedRooms.length === 0 &&
                    "flex items-center justify-center"
                )}
              >
                {selectedRooms.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center">
                    Kéo phòng từ danh sách bên dưới vào đây
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedRooms.map((room, index) => (
                      <div
                        key={room.properties.id}
                        className="flex items-center justify-between bg-gradient-to-r from-violet-100 to-indigo-100 rounded-lg p-3 border border-violet-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-slate-800 text-sm line-clamp-1">
                              {room.properties.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatPrice(room.properties.price)} •{" "}
                              {room.properties.area}m²
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveRoom(room.properties.id)}
                          className="p-1 hover:bg-red-100 rounded-full transition-colors"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedRooms.length > 0 && (
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Xóa tất cả
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={selectedRooms.length < 2 || isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Đang phân tích...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-1" />
                        Phân tích AI
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded-lg">
                  {error}
                </p>
              )}
            </div>

            {/* Analysis Result */}
            {analysisResult && analysisResult.success && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <h3 className="font-semibold text-violet-700 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Kết quả phân tích
                </h3>

                {/* Best Choice */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                    🏆 Lựa chọn tốt nhất
                  </p>
                  <p className="font-medium text-slate-800">
                    {
                      selectedRooms.find(
                        (r) =>
                          r.properties.id ===
                          analysisResult.analysis.bestChoice.roomId
                      )?.properties.title
                    }
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {analysisResult.analysis.bestChoice.reason}
                  </p>
                </div>

                {/* Rankings */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    Xếp hạng chi tiết:
                  </p>
                  {analysisResult.analysis.rankings.map((ranking) => (
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
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                              ranking.rank === 1
                                ? "bg-amber-500 text-white"
                                : ranking.rank === 2
                                ? "bg-slate-400 text-white"
                                : "bg-orange-400 text-white"
                            )}
                          >
                            {ranking.rank}
                          </span>
                          <span className="font-medium text-slate-800 text-sm">
                            {ranking.title}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-violet-600">
                          {ranking.score}/100
                        </span>
                      </div>

                      {/* Score bars */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-slate-500">Giá:</span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${ranking.priceScore}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Diện tích:</span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${ranking.areaScore}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Vị trí:</span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-violet-500 h-1.5 rounded-full"
                              style={{ width: `${ranking.locationScore}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Tiện nghi:</span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full"
                              style={{ width: `${ranking.amenitiesScore}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pros & Cons */}
                      <div className="flex gap-4 text-xs">
                        <div className="flex-1">
                          <span className="text-emerald-600 font-medium">
                            Ưu điểm:
                          </span>
                          <ul className="mt-1 space-y-0.5 text-slate-600">
                            {ranking.pros.slice(0, 2).map((pro, i) => (
                              <li key={i}>• {pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex-1">
                          <span className="text-red-600 font-medium">
                            Nhược điểm:
                          </span>
                          <ul className="mt-1 space-y-0.5 text-slate-600">
                            {ranking.cons.slice(0, 2).map((con, i) => (
                              <li key={i}>• {con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Tóm tắt:
                  </p>
                  <p className="text-sm text-slate-600">
                    {analysisResult.analysis.comparisonSummary}
                  </p>
                </div>

                {/* Tips */}
                {analysisResult.analysis.tips.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 mb-2">
                      💡 Mẹo:
                    </p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      {analysisResult.analysis.tips.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Available Rooms List */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Danh sách phòng ({availableRooms.length})
              </h3>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {availableRooms.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">
                    Tất cả phòng đã được chọn
                  </p>
                ) : (
                  availableRooms.map((room) => (
                    <div
                      key={room.properties.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, room)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-grab active:cursor-grabbing hover:border-violet-300 hover:shadow-sm transition-all",
                        draggedRoom?.properties.id === room.properties.id &&
                          "opacity-50 border-violet-400"
                      )}
                    >
                      <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">
                          {room.properties.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {formatPrice(room.properties.price)} •{" "}
                          {room.properties.area}m²
                          {room.properties.address &&
                            ` • ${room.properties.address}`}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs rounded-full",
                          room.properties.roomType === "studio"
                            ? "bg-violet-100 text-violet-700"
                            : room.properties.roomType === "apartment"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {room.properties.roomType === "studio"
                          ? "Studio"
                          : room.properties.roomType === "apartment"
                          ? "Căn hộ"
                          : "Phòng trọ"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
