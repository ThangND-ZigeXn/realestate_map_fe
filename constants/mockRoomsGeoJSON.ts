import { RoomFeatureCollection } from "@/types/room";

export const MOCK_ROOMS_GEOJSON: RoomFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [105.8542, 21.0285],
      },
      properties: {
        id: 1,
        title: "Studio cozy gần Hồ Tây",
        price: 3500000,
        area: 25,
        address: "100 Đường ABC, Quận Đống Đa, Hà Nội",
        roomType: "studio",
        status: "available",
        description: "Phòng studio tại khu vực yên tĩnh, gần Hồ Tây",
        phone: "02438345678",
        phoneFormatted: "(024) 3834-5678",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [105.8412, 21.0245],
      },
      properties: {
        id: 2,
        title: "Căn hộ mini full nội thất",
        price: 4500000,
        area: 35,
        address: "25 Ngõ 123, Phố Huế, Hai Bà Trưng, Hà Nội",
        roomType: "apartment",
        status: "available",
        description: "Căn hộ mini đầy đủ tiện nghi, gần trung tâm",
        phone: "0912345678",
        phoneFormatted: "0912 345 678",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [105.8623, 21.0312],
      },
      properties: {
        id: 3,
        title: "Phòng trọ giá rẻ Cầu Giấy",
        price: 2000000,
        area: 18,
        address: "Ngách 5, Ngõ 68 Dịch Vọng, Cầu Giấy, Hà Nội",
        roomType: "room",
        status: "available",
        description: "Phòng trọ sạch sẽ, an ninh tốt",
        phone: "0987654321",
        phoneFormatted: "0987 654 321",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [105.8501, 21.0189],
      },
      properties: {
        id: 4,
        title: "Studio cao cấp Thanh Xuân",
        price: 5500000,
        area: 40,
        address: "Tòa nhà Star Tower, Thanh Xuân, Hà Nội",
        roomType: "studio",
        status: "rented",
        description: "Studio cao cấp với view đẹp",
        phone: "0901234567",
        phoneFormatted: "0901 234 567",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [105.8678, 21.0356],
      },
      properties: {
        id: 5,
        title: "Phòng trọ sinh viên Bách Khoa",
        price: 1800000,
        area: 15,
        address: "Ngõ 20 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội",
        roomType: "room",
        status: "available",
        description: "Phòng trọ gần Đại học Bách Khoa, tiện đi học",
        phone: "0976543210",
        phoneFormatted: "0976 543 210",
      },
    },
  ],
};

