import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  root: ".", // ✅ 현재 프로젝트 루트에서 시작하도록 설정
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // ✅ `@`을 `src`로 설정
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: ["abcqkdnxm.o-r.kr"], // ✅ 무료 도메인 추가
  }
});
