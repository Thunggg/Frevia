import { defineConfig } from "tsup";

const isWatch = process.argv.includes("--watch");

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  // Watch phải giữ dist — nếu clean song song với api#dev sẽ làm Nest mất type / không start.
  clean: !isWatch,
});