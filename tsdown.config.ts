import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  outDir: "lib",
  dts: true,
  fixedExtension: true,
  exports: true,
  platform: "neutral",
  deps: {
    dts: {
      neverBundle: ["eslint", "estree"],
    },
    onlyBundle: [],
  },
});
