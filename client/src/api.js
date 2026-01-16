import axios from "axios";

const api = axios.create({
  baseURL: "/api", // ✅ REQUIRED FOR SAME-REPO VERCEL
  withCredentials: true,
});

export default api;
