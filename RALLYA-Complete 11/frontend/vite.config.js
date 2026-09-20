import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api is proxied to the Express backend (npm run dev in /backend).
// The frontend also imports the backend sample data as an offline "demo mode" fallback.
export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: [".."] },
    proxy: { "/api": "http://localhost:5001" },
  },
});
