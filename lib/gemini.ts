import type {
  AIAnalysisRequest,
  AIAnalysisResponse,
  RoomForAnalysis,
} from "@/types/ai-assistant";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Build the prompt for Gemini
function buildAnalysisPrompt(rooms: RoomForAnalysis[]): string {
  const roomsJson = JSON.stringify(rooms, null, 2);

  return `Bạn là một chuyên gia tư vấn bất động sản thông minh. Hãy phân tích và so sánh các phòng trọ/căn hộ sau đây:

${roomsJson}

Nhiệm vụ của bạn:
1. So sánh tất cả các phòng dựa trên: giá thuê, diện tích, vị trí, tiện nghi.
2. Xếp hạng từ phòng phù hợp nhất tới ít phù hợp nhất.
3. Đưa ra lý do rõ ràng cho mỗi xếp hạng.
4. Đề xuất lựa chọn tốt nhất với lý do chi tiết.

Trả về kết quả theo đúng định dạng JSON sau (KHÔNG thêm markdown code blocks):
{
  "success": true,
  "analysis": {
    "rankings": [
      {
        "id": <room_id>,
        "title": "<room_title>",
        "rank": <1|2|3>,
        "score": <0-100>,
        "priceScore": <0-100>,
        "areaScore": <0-100>,
        "locationScore": <0-100>,
        "amenitiesScore": <0-100>,
        "pros": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
        "cons": ["<điểm yếu 1>", "<điểm yếu 2>"],
        "recommendation": "<nhận xét ngắn gọn>"
      }
    ],
    "bestChoice": {
      "roomId": <best_room_id>,
      "reason": "<lý do chọn phòng này>"
    },
    "comparisonSummary": "<tóm tắt so sánh tổng quan>",
    "tips": ["<mẹo 1>", "<mẹo 2>", "<mẹo 3>"]
  },
  "generatedAt": "<ISO timestamp>"
}`;
}

// Parse Gemini response to extract JSON
function parseGeminiResponse(text: string): AIAnalysisResponse {
  // Remove markdown code blocks if present
  let cleanedText = text.trim();
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.slice(7);
  } else if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.slice(3);
  }
  if (cleanedText.endsWith("```")) {
    cleanedText = cleanedText.slice(0, -3);
  }
  cleanedText = cleanedText.trim();

  try {
    return JSON.parse(cleanedText) as AIAnalysisResponse;
  } catch {
    // If parsing fails, create a fallback response
    return {
      success: false,
      analysis: {
        rankings: [],
        bestChoice: { roomId: 0, reason: "Không thể phân tích" },
        comparisonSummary: text,
        tips: [],
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

// Call Gemini API to analyze rooms
export async function analyzeRoomsWithGemini(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  if (request.rooms.length < 2) {
    throw new Error("Cần ít nhất 2 phòng để so sánh");
  }

  if (request.rooms.length > 3) {
    throw new Error("Chỉ có thể so sánh tối đa 3 phòng");
  }

  const prompt = buildAnalysisPrompt(request.rooms);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || "";

      // Handle quota exceeded error
      if (errorMessage.includes("quota") || errorMessage.includes("Quota") || response.status === 429) {
        throw new Error("⏳ API đang quá tải. Vui lòng thử lại sau 30 giây.");
      }

      // Handle rate limit
      if (errorMessage.includes("rate") || errorMessage.includes("Rate")) {
        throw new Error("⏳ Đang bị giới hạn tốc độ. Vui lòng đợi một chút.");
      }

      throw new Error(errorMessage || "Gemini API request failed");
    }

    const data = await response.json();

    // Extract text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("Không nhận được phản hồi từ AI. Vui lòng thử lại.");
    }

    return parseGeminiResponse(generatedText);
  } catch (error) {
    console.error("Gemini API error:", error);

    // Re-throw with user-friendly message if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Không thể kết nối đến AI. Kiểm tra kết nối mạng.");
    }

    throw error;
  }
}

// Export for testing/mocking
export { buildAnalysisPrompt, parseGeminiResponse };

