import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker from "../src/index.js";
import COURSE from "../public/data/course.js";
const origin = "https://course.example";
const env = {
  ASSETS: {
    async fetch(request) {
      const path = new URL(request.url).pathname;
      return new Response(
        await readFile(
          new URL(
            "../public" + (path === "/" ? "/index.html" : path),
            import.meta.url,
          ),
        ),
      );
    },
  },
};
const get = (path, init) => worker.fetch(new Request(origin + path, init), env);
test("HTML loads external styles and script, and referenced static assets exist", async () => {
  const r = await get("/");
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.match(html, /href="\/css\/styles.css"/);
  assert.match(html, /type="module" src="\/js\/app.js"/);
  assert.doesNotMatch(html, /<style>|<script>/);
  assert.match(r.headers.get("content-security-policy"), /script-src 'self';/);
  for (const path of [
    "/css/styles.css",
    "/js/app.js",
    "/data/course.js",
    "/sw.js",
    "/manifest.webmanifest",
    "/icons/acme-180.png",
    "/icons/acme-192.png",
    "/icons/acme-512.png",
    "/icons/acme-maskable-512.png",
  ]) {
    const a = await get(path);
    assert.equal(a.status, 200, path);
    assert.ok((await a.arrayBuffer()).byteLength > 0);
  }
});
test("catalog, manifest, service worker and 404 preserve contracts", async () => {
  const lessons = COURSE.flatMap((m) => m.topics.flatMap((t) => t.lessons));
  assert.equal(lessons.length, 77);
  assert.equal(new Set(lessons.map((l) => l.id)).size, 77);
  assert.equal(
    (await get("/sw.js")).headers.get("service-worker-allowed"),
    "/",
  );
  assert.equal(
    (await (await get("/manifest.webmanifest")).json()).start_url,
    "/?source=pwa",
  );
  assert.equal((await get("/missing")).status, 404);
});
test("GitHub configuration remains disabled and rejects writes", async () => {
  assert.deepEqual(await (await get("/api/github/status")).json(), {
    configured: false,
  });
  assert.deepEqual(await (await get("/api/catalog")).json(), { lessons: [] });
  assert.equal(
    (
      await get("/api/github/save", {
        method: "POST",
        headers: { Origin: origin, "oai-authenticated-user-id": "fake" },
      })
    ).status,
    503,
  );
  assert.equal((await get("/api/github/save", { method: "POST" })).status, 403);
});
test("media rejects unlisted IDs and malformed ranges", async () => {
  assert.equal((await get("/media/not-a-lesson")).status, 404);
  assert.equal(
    (
      await get("/media/" + COURSE[0].topics[0].lessons[0].id, {
        headers: { Range: "bad" },
      })
    ).status,
    416,
  );
});
test("media keeps partial GET/HEAD responses and rejects upstream HTML", async () => {
  const old = globalThis.fetch;
  const id = COURSE[0].topics[0].lessons[0].id;
  try {
    globalThis.fetch = async (url, init) => {
      assert.match(url, /drive.usercontent.google.com\/download/);
      assert.equal(init.headers.Range, "bytes=0-3");
      return new Response(init.method === "HEAD" ? null : "test", {
        status: 206,
        headers: {
          "content-type": "video/mp4",
          "content-range": "bytes 0-3/100",
          "accept-ranges": "bytes",
          "content-length": "4",
        },
      });
    };
    for (const method of ["GET", "HEAD"]) {
      const r = await get("/media/" + id, {
        method,
        headers: { Range: "bytes=0-3" },
      });
      assert.equal(r.status, 206);
      assert.equal(r.headers.get("content-range"), "bytes 0-3/100");
      assert.equal(await r.text(), method === "HEAD" ? "" : "test");
    }
    globalThis.fetch = async () =>
      new Response("<html>login</html>", {
        headers: { "content-type": "text/html" },
      });
    assert.equal((await get("/media/" + id)).status, 502);
  } finally {
    globalThis.fetch = old;
  }
});
