import getReleasePlan from "@changesets/get-release-plan";
import path from "path";
import { fileURLToPath } from "url";

// eslint-disable-next-line @typescript-eslint/naming-convention -- ESM __filename polyfill
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention -- ESM __dirname polyfill
const __dirname = path.dirname(__filename);

/** Get new version string from changesets */
export async function getNewVersion(): Promise<string> {
  const releasePlan = await getReleasePlan(path.resolve(__dirname, "../.."));

  return releasePlan.releases.find(
    ({ name }) => name === "jsonc-eslint-parser",
  )!.newVersion;
}
