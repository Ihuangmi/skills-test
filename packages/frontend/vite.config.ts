import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 将/api请求代理到本地服务端
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  define: {
    // 生产环境的服务端 URL（部署时需要修改）
    "process.env.VITE_SERVER_URL": JSON.stringify(
      process.env.VITE_SERVER_URL || ""
    ),
  },
});
