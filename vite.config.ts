import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/ws": {
        // Proxy WebSocket connections
        target: "ws://localhost:8080", // Your Go WebSocket server address
        ws: true,
      },
    },
  },
});
