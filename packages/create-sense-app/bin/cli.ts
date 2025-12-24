#!/usr/bin/env node
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import fs from "node:fs";

const projectName = process.argv[2] || "sense-app";
const projectDir = join(process.cwd(), projectName);

console.log(`\n Creating a new Sense app in ${projectName}...\n`);

if (fs.existsSync(projectDir)) {
  console.error(`Error: Directory ${projectName} already exists.`);
  process.exit(1);
}
await mkdir(projectDir, { recursive: true });

const repo = "github:ommgh/sense/packages/sense-template";

const exitCode = await new Promise<number>((resolve) => {
  const degit = spawn("npx", ["degit", repo, projectName], {
    stdio: ["ignore", "inherit", "inherit"],
    shell: true,
  });

  degit.on("close", (code) => {
    resolve(code ?? 1);
  });

  degit.on("error", () => {
    resolve(1);
  });
});

if (exitCode !== 0) {
  process.exit(1);
}

const lockfilePath = join(projectDir, "bun.lockb");
if (fs.existsSync(lockfilePath)) {
  await rm(lockfilePath);
}

const pkgPath = join(projectDir, "package.json");
const pkgStr = await readFile(pkgPath, "utf-8");
const pkg = JSON.parse(pkgStr);

pkg.name = projectName;

pkg.dependencies["@ommishra/sense"] = "latest";

await writeFile(pkgPath, JSON.stringify(pkg, null, 2));

console.log(`\nDone! Now run:\n`);
console.log(`  cd ${projectName}`);
console.log(`  npm install  # or pnpm install, yarn, bun install`);
console.log(`  npm run dev  # or pnpm dev, yarn dev, bun dev`);
