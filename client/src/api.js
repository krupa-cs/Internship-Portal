import axios from "axios";

const api = axios.create({
  baseURL: "https://internship-portal-4yld.vercel.app",
  withCredentials: true,
});

export default api;
