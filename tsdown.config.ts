import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: "esm",
  outDir: "lib",
  dts: true,
  clean: true,
  platform: "node",
  // Type-only imports are stripped by TypeScript, no need to externalize them
  external: [],
  // Allow bundling of type-only dependencies
  inlineOnly: false,
});
