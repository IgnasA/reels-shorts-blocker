// Renders the extension icons from one SVG design: three upright reel frames
// with dotted borders, each crossed out. Writes icons/icon{16,32,48,128}.png
// and store/src/icon-artwork.png (the artwork without the store icon's
// padding, used by scripts/store-images.js).
//
// Run with `npm run icons`, then `npm run store:images` so the screenshots and
// promo tile pick up the new artwork.

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");

const BG = "#1e293b";
const FRAME = "#ffffff";
const CROSS = "#ff6b5e";

// The design is drawn in a 96x96 box. Small sizes get thicker strokes, fewer
// dots and bigger crosses so they stay readable in the toolbar. At 16px dots
// can't be drawn, so that size uses solid frames crossed corner to corner
// (dots: 0, cross: "full").
const STYLES = {
  large: { frameW: 24, frameH: 50, gap: 4.5, frameStroke: 2.8, dots: 26, cross: 6.5, crossStroke: 3.6, radius: 20 },
  medium: { frameW: 26, frameH: 58, gap: 3, frameStroke: 4, dots: 18, cross: 7, crossStroke: 4.6, radius: 18 },
  smallish: { frameW: 24, frameH: 60, gap: 6, frameStroke: 4.6, dots: 12, cross: 5.5, crossStroke: 5, radius: 16 },
  small: { frameW: 28, frameH: 66, gap: 2, frameStroke: 6, dots: 0, cross: "full", crossStroke: 7, radius: 14 },
};

function artwork(s) {
  const total = s.frameW * 3 + s.gap * 2;
  const x0 = (96 - total) / 2;
  const y = (96 - s.frameH) / 2;
  const cy = y + s.frameH / 2;
  let frames = "";
  for (let i = 0; i < 3; i++) {
    const x = x0 + i * (s.frameW + s.gap);
    const cx = x + s.frameW / 2;
    const h = s.frameStroke / 2;
    // pathLength spreads the dots evenly around the frame, so each frame gets
    // exactly `dots` dots whatever its size.
    const dotted = s.dots ? `stroke-linecap="round" pathLength="${s.dots * 10}" stroke-dasharray="0 10"` : `stroke-opacity="0.85"`;
    const [dx, dy] = s.cross === "full" ? [s.frameW / 2 - s.frameStroke * 1.4, s.frameH / 2 - s.frameStroke * 1.4] : [s.cross, s.cross];
    frames += `
      <rect x="${x + h}" y="${y + h}" width="${s.frameW - s.frameStroke}" height="${s.frameH - s.frameStroke}" rx="3"
        fill="none" stroke="${FRAME}" stroke-width="${s.frameStroke}" ${dotted} />
      <path d="M${cx - dx} ${cy - dy} L${cx + dx} ${cy + dy} M${cx + dx} ${cy - dy} L${cx - dx} ${cy + dy}"
        stroke="${CROSS}" stroke-width="${s.crossStroke}" stroke-linecap="round" />`;
  }
  return `<rect width="96" height="96" rx="${s.radius}" fill="${BG}" />${frames}`;
}

// padding: transparent margin in output pixels (the 128px store icon wants 16).
function svg(size, style, padding = 0) {
  const inner = size - padding * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${padding} ${padding}) scale(${inner / 96})">${artwork(STYLES[style])}</g>
  </svg>`;
}

const OUTPUTS = [
  { file: "icons/icon16.png", size: 16, style: "small" },
  { file: "icons/icon32.png", size: 32, style: "smallish" },
  { file: "icons/icon48.png", size: 48, style: "medium" },
  { file: "icons/icon128.png", size: 128, style: "large", padding: 16 },
  { file: "store/src/icon-artwork.png", size: 192, style: "large" },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const { file, size, style, padding } of OUTPUTS) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${svg(size, style, padding)}</body></html>`
    );
    await page.locator("svg").screenshot({ path: path.join(ROOT, file), omitBackground: true });
    console.log(`Wrote ${file}`);
  }
  await browser.close();
})();
