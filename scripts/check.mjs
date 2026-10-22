import { readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
function check(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) check(path);
    else if (/\.(m?js)$/.test(path))
      execFileSync(process.execPath, ["--check", path], { stdio: "inherit" });
  }
}
for (const dir of ["src", "public", "scripts", "tests"]) check(dir);
console.log("JavaScript syntax verified.");
