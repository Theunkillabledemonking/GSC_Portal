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
    host: '0.0.0.0', // ✅ 외부에서 접속 가능하게 설정
    port: 5176,      // ✅ 포트 고정 (변경 가능)
    strictPort: true // ✅ 지정한 포트가 사용 중이면 실패 (자동 변경 방지)
  }
});
