// The store/ assets meet the Chrome Web Store's size rules and match the manifest.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { read, root } = require("./helpers");

const manifest = JSON.parse(read("manifest.json"));

function pngSize(file) {
  const buf = fs.readFileSync(path.join(root, file));
  assert.equal(buf.toString("ascii", 1, 4), "PNG", `${file} is not a PNG`);
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

test("screenshots are 1280x800 PNGs, one to five of them", () => {
  const shots = fs.readdirSync(path.join(root, "store/screenshots")).filter((f) => f.endsWith(".png"));
  assert.ok(shots.length >= 1 && shots.length <= 5, `${shots.length} screenshots`);
  for (const f of shots) assert.deepEqual(pngSize(`store/screenshots/${f}`), [1280, 800], f);
});

test("the small promo tile is a 440x280 PNG", () => {
  assert.deepEqual(pngSize("store/promo-tile-440x280.png"), [440, 280]);
});

test("the listing's name and summary match the manifest", () => {
  const blocks = [...read("store/listing.md").matchAll(/```\n([\s\S]*?)\n```/g)].map((m) => m[1]);
  assert.equal(blocks[0], manifest.name);
  assert.equal(blocks[1], manifest.description);
  assert.match(blocks[2], /not affiliated with or endorsed by Instagram, Meta, YouTube or Google/);
});
