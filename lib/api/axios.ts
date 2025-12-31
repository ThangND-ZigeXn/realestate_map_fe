import axios from "axios";

import { Configuration, RoomsApi } from "@/lib/api/generated";

const axiosInstance = axios.create();
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "";

export const roomConnect = new RoomsApi(
  { basePath: API_ENDPOINT } as Configuration,
  undefined,
  axiosInstance
);
