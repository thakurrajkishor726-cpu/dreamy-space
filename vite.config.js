import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Lets the frontend call /api/* in dev exactly as it does in production,
      // where vercel.json rewrites those to the Python function.
      //
      //   npm run api      # uvicorn server.main:app --port 8000
      //
      // API_PORT overrides both sides when 8000 is taken — which on WSL can
      // outlive the process that held it.
      "/api": {
        target: `http://127.0.0.1:${process.env.API_PORT || 8000}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Off by default in this Vite/rolldown build, which would inline the
        // lazy-loaded admin (and all of Firebase) into the public bundle.
        codeSplitting: true,
      },
    },
  },
});
