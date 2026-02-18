import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: "esm",
  outDir: "lib",
  dts: true,
  clean: true,
  inlineOnly: false,
  // Need to specify .js extension even though package.json has "type": "module"
  // because tsdown defaults to .mjs for ESM output
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
});
