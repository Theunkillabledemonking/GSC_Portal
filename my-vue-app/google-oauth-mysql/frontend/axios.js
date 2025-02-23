// ✅ Axios를 설정하여 API 요청 시 Access Token을 자동으로 포함
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.headers.post["Content-Type"] = "application/json";

// ✅ 요청 인터셉터: Access Token을 헤더에 추가
axios.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;
