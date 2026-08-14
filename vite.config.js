import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Lets the admin call /api/sign-upload in dev exactly as it does in
      // production. Run the signer with: uvicorn api.index:app --port 8000
      "/api": {
        target: "http://127.0.0.1:8000",
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
