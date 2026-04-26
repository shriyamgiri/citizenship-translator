import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // exposes to local network so you can open on your phone
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
