/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O GitHub Pages serve o site em https://<user>.github.io/<repo>/, então o
// `base` precisa apontar para o nome do repositório em produção. Em dev fica "/".
// Pode ser sobrescrito via env BASE_PATH (ex.: o workflow do Pages injeta isso).
const base = process.env.BASE_PATH ?? "/Retirement/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? base : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@lib": new URL("./src/lib", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
}));
