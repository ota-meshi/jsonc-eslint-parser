import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: "esm",
  outDir: "lib",
  dts: true,
  clean: true,
  platform: "node",
  external: ["eslint", "@eslint/core", "estree"],
});
