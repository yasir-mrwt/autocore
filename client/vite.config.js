import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          redux: ["@reduxjs/toolkit", "react-redux"],
          mui: ["@mui/material", "@emotion/react", "@emotion/styled"],
          forms: ["formik", "yup"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
