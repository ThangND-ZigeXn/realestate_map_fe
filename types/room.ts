interface FilterValues {
  location: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  roomType: string;
}

interface Room {
  id: string;
  title: string;
  address: string;
  price: number;
  area: number;
  roomType: string;
  images: string[];
  description: string;
  amenities: string[];
  latitude: number;
  longitude: number;
  landlord: {
    name: string;
    phone: string;
  };
  createdAt: string;
}

export type { FilterValues, Room };
