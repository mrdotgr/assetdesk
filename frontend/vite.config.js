import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set up Vite to serve the React frontend during development.
export default defineConfig({
  plugins: [react()],

  // Keep the development website on this local address and port.
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,

    // Forward frontend API requests to the Python backend.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
