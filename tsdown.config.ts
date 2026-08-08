import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  outDir: "lib",
  dts: true,
  fixedExtension: true,
  platform: "neutral",
  deps: {
    dts: {
      neverBundle: ["eslint", "estree"],
    },
    onlyBundle: [],
  },
});
