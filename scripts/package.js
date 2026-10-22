// Builds the store upload: copies only the files the extension needs into
// dist/extension and zips them as dist/reels-shorts-blocker-<version>.zip.
//   npm run package
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");

// Everything that ships. Tests, docs, scripts and node_modules stay out.
const EXTENSION_FILES = ["manifest.json", "settings.js", "urls.js", "content", "popup", "icons"];

function stage(dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  // OS clutter (.DS_Store, Thumbs.db) and other dotfiles never ship.
  const filter = (src) => !/^(\.|Thumbs\.db$)/.test(path.basename(src));
  for (const f of EXTENSION_FILES) fs.cpSync(path.join(ROOT, f), path.join(dest, f), { recursive: true, filter });
  return dest;
}

if (require.main === module) {
  const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
  const dir = stage(path.join(ROOT, "dist", "extension"));
  const zip = path.join(ROOT, "dist", `reels-shorts-blocker-${version}.zip`);
  fs.rmSync(zip, { force: true });
  execFileSync("zip", ["-r", "-X", "-q", zip, "."], { cwd: dir });
  console.log(`Wrote ${path.relative(ROOT, zip)}`);
}

module.exports = { EXTENSION_FILES, stage };
