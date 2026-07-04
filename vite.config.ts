import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 3000,
  },
  optimizeDeps: {
    exclude: ["bun"],
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [tanstackStart({}), react()],
});
