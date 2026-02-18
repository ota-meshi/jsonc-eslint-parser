import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: "esm",
  outDir: "lib",
  dts: true,
  clean: true,
  inlineOnly: false,
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
});
