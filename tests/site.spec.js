// What every release should pass, in all three browser engines.
const { test, expect } = require("@playwright/test");

// Every page, with its language, and the matching page in the other language.
const PAGES = [
  { path: "/", lang: "en-GB", other: "/cy/" },
  { path: "/cy/", lang: "cy", other: "/" },
  { path: "/past-gigs/", lang: "en-GB", other: "/cy/past-gigs/" },
  { path: "/cy/past-gigs/", lang: "cy", other: "/past-gigs/" },
  { path: "/promo/", lang: "en-GB", other: "/cy/promo/" },
  { path: "/cy/promo/", lang: "cy", other: "/promo/" },
];
const HOMES = [
  { path: "/", book: "Book us", past: "/past-gigs/", promo: "/promo/" },
  { path: "/cy/", book: "Bwciwch ni", past: "/cy/past-gigs/", promo: "/cy/promo/" },
];
const WIDTHS = [320, 390, 820, 1440];

// Errors from the site itself (not from the YouTube player or other embeds).
function watchErrors(page, baseURL) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && (m.location().url || "").startsWith(baseURL)) errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.url().startsWith(baseURL) && r.status() >= 400) errors.push(r.status() + " " + r.url());
  });
  return errors;
}

// Every image on the page (including lazy ones not yet scrolled to), loaded fresh.
// Returns the addresses of any that fail to load as an image.
async function brokenImages(page) {
  return page.evaluate(async () => {
    const urls = [...new Set([...document.images].map((i) => i.currentSrc || i.src).filter(Boolean))];
    const results = await Promise.all(urls.map((url) => new Promise((done) => {
      const probe = new Image();
      probe.onload = () => done(probe.naturalWidth ? null : url);
      probe.onerror = () => done(url);
      probe.src = url;
    })));
    return results.filter(Boolean);
  });
}

for (const p of PAGES) {
  for (const width of WIDTHS) {
    test(`${p.path} at ${width}px: loads cleanly and fits the screen`, async ({ page, baseURL }) => {
      const errors = watchErrors(page, baseURL);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(p.path);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);

      expect(await brokenImages(page), "images that failed to load").toEqual([]);
      expect(errors, "errors from the site").toEqual([]);
    });
  }

  test(`${p.path}: the language switch goes to the same page in the other language`, async ({ page }) => {
    await page.goto(p.path);
    const hrefs = await page.locator("a[hreflang]").evaluateAll((as) => as.map((a) => new URL(a.href).pathname));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) expect(h).toBe(p.other);
  });
}

for (const h of HOMES) {
  test(`${h.path}: links to the past gigs and promo kit pages`, async ({ page }) => {
    await page.goto(h.path);
    await expect(page.locator(`a[href="${h.past}"]`).first()).toBeVisible();
    await expect(page.locator(`#book a[href="${h.promo}"]`)).toBeVisible();
    await expect(page.locator(`footer a[href="${h.promo}"]`)).toBeVisible();
  });

  test(`${h.path}: photo viewer opens, steps through and closes`, async ({ page }) => {
    await page.goto(h.path);
    const first = page.locator(".gallery a").first();
    if (!(await first.count())) test.skip(true, "no photos");
    await first.click();
    const box = page.locator("#lightbox");
    await expect(box).toBeVisible();
    await expect.poll(() => box.locator("img").evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
    const firstSrc = await box.locator("img").getAttribute("src");
    await page.keyboard.press("ArrowRight");
    await expect(box.locator("img")).not.toHaveAttribute("src", firstSrc);
    await page.keyboard.press("Escape");
    await expect(box).toBeHidden();
  });

  test(`${h.path}: "Book us" face is masked and the light comes up`, async ({ page, baseURL }) => {
    const errors = watchErrors(page, baseURL);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(h.path);
    const book = page.locator("#book");
    await expect(book.locator("h2")).toHaveText(h.book);

    // The fade only works if the browser applies the mask; without it the face is a hard-edged box.
    const mask = await book.evaluate((el) => {
      const s = getComputedStyle(el, "::before");
      return s.maskImage || s.webkitMaskImage || "";
    });
    expect(mask).toContain("spot-mask.svg");

    // Lights are down until the section scrolls into view, then come up.
    await expect(book).toHaveClass(/lights-down/);
    await book.scrollIntoViewIfNeeded();
    await expect(book).not.toHaveClass(/lights-down/, { timeout: 5000 });
    expect(errors).toEqual([]);
  });

  for (const width of [390, 1440]) {
    test(`${h.path}: "Book us" looks right at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(h.path);
      await page.evaluate(() => document.fonts.ready);
      const book = page.locator("#book");
      await book.scrollIntoViewIfNeeded();
      await expect(book).not.toHaveClass(/lights-down/, { timeout: 5000 });
      // Compared against the approved picture for each browser in tests/site.spec.js-snapshots.
      await expect(book).toHaveScreenshot(`book${h.path === "/" ? "" : "-cy"}-${width}.png`, { animations: "disabled" });
    });
  }
}

for (const path of ["/past-gigs/", "/cy/past-gigs/"]) {
  test(`${path}: past gigs are listed, newest first, with flyers that open`, async ({ page }) => {
    await page.goto(path);
    const dates = await page.locator("#past-list > li:visible").evaluateAll((lis) => lis.map((li) => li.dataset.date));
    expect(dates.length).toBeGreaterThan(5);
    expect([...dates].sort().reverse()).toEqual(dates);
    await page.locator("#past-list .gig-flyer a").first().click();
    await expect(page.locator("#lightbox")).toBeVisible();
    await page.keyboard.press("Escape");
  });
}

for (const path of ["/promo/", "/cy/promo/"]) {
  test(`${path}: every promo kit download works`, async ({ page, request }) => {
    await page.goto(path);
    const links = await page.locator("#promo a[download]").evaluateAll((as) => [...new Set(as.map((a) => a.href))]);
    expect(links.length).toBeGreaterThan(10);
    for (const url of links) {
      const res = await request.get(url);
      expect(res.status(), url).toBe(200);
      expect(res.headers()["content-type"], url).toMatch(/^image\//);
    }
  });

  test(`${path}: promo previews open in the viewer with a download button`, async ({ page }) => {
    await page.goto(path);
    await page.locator("#promo .promo-preview[data-group]").first().click();
    const box = page.locator("#lightbox");
    await expect(box).toBeVisible();
    await expect(box.locator("[data-lb='download']")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test(`${path}: "Copy" puts the band text on the clipboard`, async ({ page, context, browserName }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(path);
    const button = page.locator("#promo [data-copy='copy-bio']");
    const label = await button.textContent();
    await button.click();
    // Either it copied (the label changes), or, where the clipboard is blocked, the text is selected to copy by hand.
    await expect.poll(async () => (await button.textContent()) !== label || (await page.evaluate(() => String(window.getSelection()).length > 50))).toBe(true);
  });
}

for (const path of ["/", "/cy/", "/past-gigs/", "/cy/promo/"]) {
  for (const width of [320, 1440]) {
    test(`${path} at ${width}px: the bar slides in after the header, and fits`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const bar = page.locator("#bar");
      await expect(bar).toBeHidden();

      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        const header = document.querySelector(".masthead");
        window.scrollTo(0, header.offsetTop + header.offsetHeight + 200);
      });
      await expect(bar).toBeVisible();
      const fit = await bar.evaluate((el) => ({
        bookRight: el.querySelector(".bar-book").getBoundingClientRect().right,
        height: el.getBoundingClientRect().height,
        screen: window.innerWidth,
      }));
      expect(fit.bookRight, "Book us runs off the screen").toBeLessThanOrEqual(fit.screen);
      expect(fit.height, "bar has wrapped onto two lines").toBeLessThan(70);

      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(bar).toBeHidden();
    });
  }
}
