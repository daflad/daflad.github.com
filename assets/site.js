// Past gigs page: gigs still to come when the site was last published are in the list,
// hidden. Show the ones whose date has passed since.
(function () {
  "use strict";
  var pastList = document.getElementById("past-list");
  if (!pastList) return;
  var today = new Date();
  var iso = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  Array.prototype.forEach.call(pastList.querySelectorAll(".gig[hidden]"), function (gig) {
    if (gig.getAttribute("data-date") < iso) gig.hidden = false;
  });
})();

// Home page: hides upcoming gigs that have passed since the site was last published,
// fills in the "Next gig" line, and handles the Add to calendar and Share buttons.
(function () {
  "use strict";

  var band = document.documentElement.getAttribute("data-band") || "";
  var upcoming = document.getElementById("upcoming");
  if (!upcoming) return;

  var empty = document.getElementById("gigs-empty");
  var nextGig = document.getElementById("next-gig");
  var status = document.getElementById("status");

  // The Welsh page avoids "yn" + venue, which would need the venue name mutated.
  var words = /^cy/i.test(document.documentElement.lang)
    ? { at: ": ", copied: "Dolen wedi'i chopïo", copyFailed: "Methu copïo'r ddolen" }
    : { at: " at ", copied: "Link copied", copyFailed: "Couldn't copy the link" };

  var now = new Date();
  var today = isoDate(now);
  var thisYear = String(now.getFullYear());
  var canShare = Boolean(navigator.share || (navigator.clipboard && window.isSecureContext));

  Array.prototype.slice.call(upcoming.children).forEach(function (gig) {
    var date = gig.getAttribute("data-date");
    // Played since the site was last published: take it off the upcoming list.
    // (The past gigs page shows it.)
    if (date < today) {
      gig.remove();
      return;
    }
    if (date.slice(0, 4) !== thisYear) gig.classList.add("show-year");
    Array.prototype.forEach.call(gig.querySelectorAll(".js-only"), function (item) {
      if (!canShare && item.querySelector('[data-action="share"]')) return;
      item.hidden = false;
    });
  });

  var first = upcoming.firstElementChild;
  upcoming.hidden = !first;
  empty.hidden = Boolean(first);
  if (first) {
    var link = nextGig.querySelector("a");
    link.href = "#" + first.id;
    link.textContent = dateLabel(first) + ", " + first.getAttribute("data-place");
    nextGig.hidden = false;
  }

  upcoming.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;
    var gig = button.closest(".gig");
    if (button.getAttribute("data-action") === "calendar") downloadCalendar(gig);
    else shareGig(gig, button);
  });

  function dateLabel(gig) {
    return gig.querySelector(".gig-day").textContent + " " + gig.querySelector(".gig-dm").textContent;
  }

  function gigUrl(gig) {
    return location.origin + location.pathname + "#" + gig.id;
  }

  function shareGig(gig, button) {
    var url = gigUrl(gig);
    var text = band + ": " + dateLabel(gig) + ", " + gig.getAttribute("data-place");
    if (navigator.share) {
      navigator.share({ title: band, text: text, url: url }).catch(function () {});
      return;
    }
    navigator.clipboard.writeText(url).then(
      function () { flash(button, words.copied); },
      function () { flash(button, words.copyFailed); }
    );
  }

  function flash(button, message) {
    var original = button.getAttribute("data-label") || button.textContent;
    button.setAttribute("data-label", original);
    button.textContent = message;
    status.textContent = message;
    setTimeout(function () {
      button.textContent = original;
      status.textContent = "";
    }, 2500);
  }

  function downloadCalendar(gig) {
    var d = gig.getAttribute("data-date").split("-").map(Number);
    var time = parseTime(gig.getAttribute("data-time"));
    var start, end;

    if (time) {
      var startDate = new Date(d[0], d[1] - 1, d[2], time[0], time[1]);
      var endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
      start = "DTSTART:" + stamp(startDate);
      end = "DTEND:" + stamp(endDate);
    } else {
      start = "DTSTART;VALUE=DATE:" + compactDate(new Date(d[0], d[1] - 1, d[2]));
      end = "DTEND;VALUE=DATE:" + compactDate(new Date(d[0], d[1] - 1, d[2] + 1));
    }

    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//" + band + "//Gigs//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + gig.id + "@" + (location.hostname || "hotdaw.gs"),
      "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""),
      start,
      end,
      "SUMMARY:" + escapeText(band + words.at + gig.getAttribute("data-venue")),
      "LOCATION:" + escapeText(gig.getAttribute("data-place")),
      "URL:" + gigUrl(gig),
      "END:VEVENT",
      "END:VCALENDAR"
    ];

    var blob = new Blob([lines.map(fold).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = gig.id + ".ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
  }

  // Accepts "9pm", "9:30pm", "8.30pm", "21:00". Returns [hours, minutes] or null.
  function parseTime(text) {
    var m = /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i.exec(text || "");
    if (!m || (!m[2] && !m[3])) return null;
    var h = parseInt(m[1], 10);
    var min = m[2] ? parseInt(m[2], 10) : 0;
    var meridiem = (m[3] || "").toLowerCase();
    if (meridiem === "pm" && h < 12) h += 12;
    if (meridiem === "am" && h === 12) h = 0;
    if (h > 23 || min > 59) return null;
    return [h, min];
  }

  function escapeText(s) {
    return s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
  }

  function fold(line) {
    var out = [];
    while (line.length > 74) {
      out.push(line.slice(0, 74));
      line = " " + line.slice(74);
    }
    out.push(line);
    return out.join("\r\n");
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoDate(dt) { return dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate()); }
  function compactDate(dt) { return dt.getFullYear() + pad(dt.getMonth() + 1) + pad(dt.getDate()); }
  function stamp(dt) { return compactDate(dt) + "T" + pad(dt.getHours()) + pad(dt.getMinutes()) + "00"; }
})();

// Photo viewer. Photo links open the image itself; with JavaScript they open
// in a full-screen viewer instead, with Previous/Next through the same group.
(function () {
  "use strict";

  var box = document.getElementById("lightbox");
  var of = /^cy/i.test(document.documentElement.lang) ? " o " : " of ";
  if (!box || typeof box.showModal !== "function") return;

  var img = box.querySelector(".lightbox-img");
  var caption = box.querySelector("[data-lb-caption]");
  var count = box.querySelector("[data-lb-count]");
  var prev = box.querySelector('[data-lb="prev"]');
  var next = box.querySelector('[data-lb="next"]');
  var download = box.querySelector('[data-lb="download"]');
  var group = [];
  var index = 0;
  var opener = null;

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-group]");
    // Let people open the photo in a new tab if they ask for it.
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    var name = link.getAttribute("data-group");
    group = Array.prototype.filter.call(document.querySelectorAll("a[data-group]"), function (a) {
      return a.getAttribute("data-group") === name;
    });
    show(group.indexOf(link));
    box.showModal();
  });

  function show(i) {
    index = (i + group.length) % group.length;
    var link = group[index];
    var thumb = link.querySelector("img");
    img.src = link.href;
    img.alt = thumb ? thumb.alt : "";
    caption.textContent = link.getAttribute("data-caption") || "";
    count.textContent = group.length > 1 ? (index + 1) + of + group.length : "";
    prev.hidden = next.hidden = count.hidden = group.length < 2;
    var file = link.getAttribute("data-download");
    download.hidden = !file;
    if (file) {
      download.href = link.href;
      download.setAttribute("download", file);
    }
  }

  box.addEventListener("click", function (event) {
    // A click on the dark area around the photo closes it.
    if (event.target === box) return box.close();
    var control = event.target.closest("[data-lb]");
    if (!control) return;
    var action = control.getAttribute("data-lb");
    if (action === "prev") show(index - 1);
    else if (action === "next") show(index + 1);
    else if (action === "close") box.close();
  });

  box.addEventListener("keydown", function (event) {
    if (group.length < 2) return;
    if (event.key === "ArrowLeft") show(index - 1);
    else if (event.key === "ArrowRight") show(index + 1);
  });

  box.addEventListener("close", function () {
    img.removeAttribute("src");
    if (opener) opener.focus();
  });
})();

// Book us: the light on the face comes up as the section scrolls into view.
// Without JavaScript, or for people who ask for less motion, it is simply lit.
(function () {
  var book = document.getElementById("book");
  if (!book || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (book.getBoundingClientRect().top < window.innerHeight) return; // already on screen

  book.classList.add("lights-down");
  var watcher = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    book.classList.remove("lights-down");
    watcher.disconnect();
  }, { threshold: 0.3 });
  watcher.observe(book);
})();

// Promo kit: "Copy" buttons put the band text on the clipboard.
(function () {
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy]");
    if (!button) return;
    var source = document.getElementById(button.getAttribute("data-copy"));
    if (!source) return;
    var label = button.textContent;

    function selectText() {
      // If the clipboard isn't available, select the text so it can be copied by hand.
      var range = document.createRange();
      range.selectNodeContents(source);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    if (!navigator.clipboard || !navigator.clipboard.writeText) return selectText();
    navigator.clipboard.writeText(source.textContent.trim()).then(function () {
      button.textContent = button.getAttribute("data-done");
      setTimeout(function () { button.textContent = label; }, 2000);
    }, selectText);
  });
})();

// The slim bar slides in once the page's big header has scrolled out of view,
// and hides again when you scroll back up to it.
(function () {
  var bar = document.getElementById("bar");
  var header = document.querySelector(".masthead");
  if (!bar || !header || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(function (entries) {
    bar.classList.toggle("is-shown", !entries[0].isIntersecting);
  }).observe(header);
})();
