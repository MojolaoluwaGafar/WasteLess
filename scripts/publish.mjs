// Publishes one app to the repository its host deploys from:
//
//   npm run publish:server -- "Commit message"           prepare and commit, don't push
//   npm run publish:server -- "Commit message" --push    ...and push (Render deploys it)
//   npm run publish:client -- "Commit message" --push    (Vercel deploys it)
//
// The live site predates this monorepo: Vercel builds the Client from
// foodwastereduction-frontend and Render builds the Server from
// foodwastereduction-backend, each from the repository root. This keeps a
// clone of each in .deploy/ (gitignored), replaces its contents with the app
// folder (never .env, node_modules or dist), refreshes its package-lock.json,
// and commits. When both apps change, publish the Server first.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TARGETS = {
  client: { app: "apps/Client", repo: "https://github.com/MojolaoluwaGafar/foodwastereduction-frontend.git" },
  server: { app: "apps/Server", repo: "https://github.com/MojolaoluwaGafar/foodwastereduction-backend.git" },
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [which, ...rest] = process.argv.slice(2);
const push = rest.includes("--push");
const message = rest.filter((arg) => arg !== "--push").join(" ").trim();
const target = TARGETS[which];

if (!target || !message) {
  console.error('Usage: node scripts/publish.mjs <client|server> "Commit message" [--push]');
  process.exit(1);
}

const run = (cmd, args, cwd, options = {}) =>
  execFileSync(cmd, args, { cwd, stdio: options.quiet ? "pipe" : "inherit", encoding: "utf8" });
const git = (args, cwd, options) => run("git", args, cwd, options);
// npm is a .cmd file on Windows, which can't be run without a shell; run its
// JavaScript entry point with Node instead (npm_execpath is set by `npm run`).
const npm = (args, cwd) =>
  process.env.npm_execpath
    ? run(process.execPath, [process.env.npm_execpath, ...args], cwd, { quiet: true })
    : execFileSync("npm", args, { cwd, stdio: "pipe", encoding: "utf8", shell: true });

// 1. A clean, up-to-date clone of the deploy repository.
const clone = join(root, ".deploy", which);
if (existsSync(join(clone, ".git"))) {
  git(["fetch", "-q", "origin"], clone);
  git(["reset", "-q", "--hard", "origin/main"], clone);
  git(["clean", "-q", "-fdx"], clone);
} else {
  rmSync(clone, { recursive: true, force: true });
  git(["clone", "-q", target.repo, clone], root);
}

// 2. Shared types copied into the app, then the app copied into the clone.
run("node", ["scripts/sync-shared.mjs"], root);
const source = join(root, target.app);
const skip = (path) => {
  const parts = relative(source, path).split(sep);
  const base = parts[parts.length - 1];
  return (
    parts.includes("node_modules") ||
    parts.includes("dist") ||
    base.endsWith(".tsbuildinfo") ||
    (/^\.env(\..*)?$/.test(base) && base !== ".env.example")
  );
};
// The deploy repo's lockfile stays (the app folder has none), so publishing
// only changes versions when package.json asks for it.
const keep = new Set([".git", "package-lock.json"]);
for (const entry of readdirSync(clone)) if (!keep.has(entry)) rmSync(join(clone, entry), { recursive: true, force: true });
cpSync(source, clone, { recursive: true, filter: (path) => !skip(path) });

// 3. Its own lockfile (the monorepo has one at the root instead).
npm(["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"], clone);

// 4. Commit, if anything changed.
git(["add", "-A"], clone, { quiet: true });
const changes = git(["diff", "--cached", "--stat"], clone, { quiet: true }).trim();
if (!changes) {
  console.log(`${which}: nothing to publish, the deploy repo already matches ${target.app}.`);
  process.exit(0);
}
console.log(changes);
const tracked = git(["ls-files"], clone, { quiet: true });
if (/(^|\/)\.env$/m.test(tracked) || /^node_modules\//m.test(tracked)) {
  console.error("Refusing to commit: a .env file or node_modules would be published.");
  process.exit(1);
}
git(["commit", "-q", "-m", `${message}\n\nPublished from the WasteLess monorepo (${target.app}).`], clone);
console.log(git(["log", "--oneline", "-1"], clone, { quiet: true }).trim());

if (push) {
  git(["push", "-q", "origin", "HEAD:main"], clone);
  console.log(`Pushed to ${target.repo}. ${which === "server" ? "Render" : "Vercel"} deploys it now.`);
} else {
  console.log(`Committed in .deploy/${which}. Run again with --push to deploy, or push from there.`);
}
