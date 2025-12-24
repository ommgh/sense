import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "bun";
import fs from "node:fs";

const projectName = process.argv[2] || "sense-app";
const projectDir = join(process.cwd(), projectName);

console.log(`\n Creating a new Sense app in ${projectName}...\n`);


if (fs.existsSync(projectDir)) {
  console.error(`Error: Directory ${projectName} already exists.`);
  process.exit(1);
}
await mkdir(projectDir, { recursive: true });


const repo = "github:ommishra/sense/packages/sense-template";
const degit = spawn(["npx", "degit", repo, projectName], {
  stdio: ["ignore", "inherit", "inherit"],
});
await degit.exited;

if (degit.exitCode !== 0) {
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
console.log(`  bun install`);
console.log(`  bun dev`);
