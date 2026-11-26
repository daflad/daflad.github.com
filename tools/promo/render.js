// Remakes the promo kit images from the layouts in this folder.
//
//   node tools/promo/render.js            writes into promo/ and promo/thumbs/
//   node tools/promo/render.js some/dir   writes somewhere else, to compare first
//
// Run it from the repo root after `npm install` and `npx playwright install chromium`.
// Each layout is a web page at the image's size; this opens it in Chromium and saves it
// as a JPG (no camera or location data: they're made from scratch, not from a phone).
// Change the words or photos in the .html files, then run this again.
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { chromium } = require("@playwright/test");

const root = path.resolve(__dirname, "../..");
const out = path.resolve(root, process.argv[2] || "promo");
const port = 4174;

// name, layout, the layout's size in CSS pixels, the image's size in pixels, and the
// preview's width. Each is drawn at exactly the image's size (the layout is zoomed to fit).
const jobs = [
  { file: "hot-dawg-assassins-poster-a4.jpg", page: "poster-face.html", w: 1240, h: 1754, px: [2480, 3508], thumb: "poster-a4.jpg", thumbW: 360 },
  { file: "hot-dawg-assassins-poster-a4-photo.jpg", page: "poster-photo.html", w: 1240, h: 1754, px: [2480, 3508], thumb: "poster-a4-photo.jpg", thumbW: 360 },
  { file: "hot-dawg-assassins-event-cover.jpg", page: "event-cover.html", w: 960, h: 503, px: [1920, 1005], thumb: "event-cover.jpg", thumbW: 600 },
  { file: "hot-dawg-assassins-square.jpg", page: "square.html", w: 540, h: 540, px: [1080, 1080], thumb: "square.jpg", thumbW: 400 },
  { file: "hot-dawg-assassins-story.jpg", page: "story.html", w: 540, h: 960, px: [1080, 1920], thumb: "story.jpg", thumbW: 288 },
];

(async () => {
  fs.mkdirSync(path.join(out, "thumbs"), { recursive: true });
  const server = spawn("python3", [path.join(root, "tests/serve.py"), root, String(port)], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch();
  try {
    for (const job of jobs) {
      const thumbH = Math.round((job.thumbW * job.px[1]) / job.px[0]);
      for (const [width, height, dest] of [[job.px[0], job.px[1], path.join(out, job.file)], [job.thumbW, thumbH, path.join(out, "thumbs", job.thumb)]]) {
        const zoom = width / job.w;
        const page = await browser.newPage({ viewport: { width, height: Math.ceil(job.h * zoom) } });
        await page.goto(`http://127.0.0.1:${port}/tools/promo/${job.page}`);
        await page.addStyleTag({ content: `html { zoom: ${zoom}; }` });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
        });
        await page.waitForTimeout(300);
        await page.screenshot({ path: dest, type: "jpeg", quality: 88, clip: { x: 0, y: 0, width, height } });
        await page.close();
        console.log("wrote", path.relative(root, dest), `${width} x ${height}`);
      }
    }
  } finally {
    await browser.close();
    server.kill();
  }
})();
