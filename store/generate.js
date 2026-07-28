/* Regenerates the Play Store assets from the running app.
   Serve the site on :8099 first — see store/README.md. */
const { chromium } = require("playwright");
const path = require("path");

const HOST = process.env.HOST || "http://192.0.2.2:8099/";
const OUT = __dirname;
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  // Play phone screenshots want 9:16 portrait; 540x960 @2x lands on 1080x1920.
  const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await ctx.route("**/*", (r) =>
    r.request().url().includes("cloudflareinsights") ? r.abort() : r.continue());
  const p = await ctx.newPage();
  const shot = (n) => p.screenshot({ path: path.join(OUT, n + ".png") });

  await p.goto(HOST + "index.html", { waitUntil: "load" });
  await p.waitForTimeout(300);
  await shot("01-home");

  await p.goto(HOST + "wordle.html", { waitUntil: "load" });
  await p.click("#grid button.lv:not([disabled])");
  await p.waitForTimeout(250);
  // Painted, not solved: shows correct/present/absent in one frame.
  await p.evaluate(() => {
    const rows = document.querySelectorAll(".wg-row");
    const paint = (r, spec) => [...rows[r].children].forEach((c, i) => {
      c.textContent = spec[i][0]; c.className = "wg-cell " + spec[i][1];
    });
    paint(0, [["C","miss"],["R","warn"],["A","miss"],["N","good"]]);
    paint(1, [["S","miss"],["H","warn"],["I","good"],["N","good"]]);
    document.querySelectorAll(".key").forEach((k, i) => {
      if (i % 6 === 0) k.classList.add("good"); else if (i % 9 === 0) k.classList.add("warn");
    });
  });
  await p.waitForTimeout(150);
  await shot("02-wordguess");

  await p.goto(HOST + "connections.html", { waitUntil: "load" });
  await p.click("#grid button.lv:not([disabled])");
  await p.waitForTimeout(300);
  await shot("03-affinity");
  await p.click(".cn-tile");
  await p.click("#hint-btn");
  await p.waitForTimeout(300);
  await shot("04-hint");

  await p.goto(HOST + "digits.html", { waitUntil: "load" });
  await p.click("#grid button.lv:not([disabled])");
  await p.waitForTimeout(300);
  await shot("05-crunch");

  // A part-finished ladder shows stars, a loss and the scale of the game.
  await p.goto(HOST + "wordle.html", { waitUntil: "load" });
  await p.evaluate(() => localStorage.setItem("pz:wordle:progress", JSON.stringify({
    reached: 23,
    stars: Object.fromEntries([...Array(22)].map((_, i) => [i + 1, (i % 3) + 1])),
    lost: { 9: true }
  })));
  await p.reload({ waitUntil: "load" });
  await p.waitForTimeout(300);
  await shot("06-levels");

  const fctx = await b.newContext({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  const fp = await fctx.newPage();
  await fp.goto("file://" + path.join(OUT, "feature-graphic.html"), { waitUntil: "load" });
  await fp.waitForTimeout(300);
  await fp.screenshot({ path: path.join(OUT, "feature-graphic.png") });

  await b.close();
  console.log("store assets written to " + OUT);
})();
