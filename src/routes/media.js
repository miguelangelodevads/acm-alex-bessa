import COURSE from "../../public/data/course.js";
import { json, security } from "../lib/responses.js";
const lessonIds = new Set(
  COURSE.flatMap((m) => m.topics.flatMap((t) => t.lessons.map((l) => l.id))),
);
export async function handleMedia(request, path) {
  const id = path.slice(7);
  if (!lessonIds.has(id)) return json({ error: "Aula inválida." }, 404);
  const headers = {};
  const range = request.headers.get("Range");
  if (range) {
    if (!/^bytes=\d*-\d*$/.test(range))
      return json({ error: "Intervalo inválido." }, 416);
    headers.Range = range;
  }
  let upstream = await fetch(
    "https://drive.usercontent.google.com/download?id=" +
      encodeURIComponent(id) +
      "&export=download",
    { method: request.method, headers, redirect: "follow" },
  );
  const type = upstream.headers.get("content-type") || "";
  if (!upstream.ok || !/(video\/|application\/octet-stream)/i.test(type)) {
    await upstream.body?.cancel();
    return json(
      { error: "Reprodução direta indisponível. Use o player do Drive." },
      502,
    );
  }
  const out = new Headers(security);
  out.set("Content-Type", type.includes("octet-stream") ? "video/mp4" : type);
  for (const h of ["content-length", "content-range", "accept-ranges"])
    if (upstream.headers.has(h)) out.set(h, upstream.headers.get(h));
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
