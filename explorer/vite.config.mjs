import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";

export default defineConfig({
  base: "/jsonc-eslint-parser/",
  plugins: [vue()],
  resolve: {
    alias: {
      module: fileURLToPath(new URL("./shim/module.js", import.meta.url)),
      "node:module": fileURLToPath(
        new URL("./shim/module.js", import.meta.url),
      ),
      path: fileURLToPath(new URL("./shim/path.js", import.meta.url)),
      "node:path": fileURLToPath(new URL("./shim/path.js", import.meta.url)),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
