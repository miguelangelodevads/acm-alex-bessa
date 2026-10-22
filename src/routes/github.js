import COURSE from "../../public/data/course.js";
import { json } from "../lib/responses.js";
const lessonIds = new Set(
  COURSE.flatMap((m) => m.topics.flatMap((t) => t.lessons.map((l) => l.id))),
);
const writes = new Map();
function configured(env) {
  return !!(
    env.GITHUB_TOKEN &&
    env.GITHUB_REPOSITORY &&
    env.ADMIN_USER_ID &&
    /^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY)
  );
}
function ghPath(env) {
  return (
    "https://api.github.com/repos/" +
    env.GITHUB_REPOSITORY +
    "/contents/aulas.json"
  );
}
function ghHeaders(env) {
  return {
    Authorization: "Bearer " + env.GITHUB_TOKEN,
    Accept: "application/vnd.github+json",
    "User-Agent": "ACME-Classroom",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}
async function readCatalog(env) {
  const r = await fetch(
    ghPath(env) + "?ref=" + encodeURIComponent(env.GITHUB_BRANCH || "main"),
    { headers: ghHeaders(env) },
  );
  if (r.status === 404) return { sha: null };
  if (!r.ok) throw Error("GitHub indisponível ou credencial sem acesso.");
  const d = await r.json();
  let body;
  try {
    body = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob((d.content || "").replace(/\s/g, "")), (c) =>
          c.charCodeAt(0),
        ),
      ),
    );
  } catch {}
  return { sha: d.sha, lessons: body?.lessons || [] };
}
export async function handleGithub(request, env, url) {
  const path = url.pathname;
  if (path === "/api/github/status" && request.method === "GET") {
    if (!configured(env)) return json({ configured: false });
    if (request.headers.get("oai-authenticated-user-id") !== env.ADMIN_USER_ID)
      return json(
        {
          configured: false,
          error: "Acesso de edição restrito ao administrador.",
        },
        403,
      );
    const d = await readCatalog(env);
    return json({
      configured: true,
      repository: env.GITHUB_REPOSITORY,
      branch: env.GITHUB_BRANCH || "main",
      sha: d.sha,
    });
  }
  if (path === "/api/catalog" && request.method === "GET") {
    if (!configured(env)) return json({ lessons: [] });
    return json(await readCatalog(env));
  }
  if (path === "/api/github/save" && request.method === "POST") {
    if (request.headers.get("Origin") !== url.origin)
      return json({ error: "Origem inválida." }, 403);
    if (!configured(env))
      return json({ error: "GitHub ainda não configurado." }, 503);
    const user = request.headers.get("oai-authenticated-user-id");
    if (!user || user !== env.ADMIN_USER_ID)
      return json({ error: "Somente o administrador pode salvar." }, 403);
    const raw = await request.text();
    if (raw.length > 350000)
      return json({ error: "Conteúdo excede o limite." }, 413);
    let d;
    try {
      d = JSON.parse(raw);
    } catch {
      return json({ error: "Formato inválido." }, 400);
    }
    if (
      typeof d.requestId !== "string" ||
      !/^[a-f0-9-]{36}$/.test(d.requestId) ||
      !Array.isArray(d.lessons) ||
      d.lessons.length !== lessonIds.size
    )
      return json({ error: "Catálogo inválido." }, 400);
    const seen = new Set();
    for (const l of d.lessons) {
      if (
        !l ||
        !lessonIds.has(l.id) ||
        seen.has(l.id) ||
        typeof l.title !== "string" ||
        !l.title.trim() ||
        l.title.length > 160 ||
        typeof l.description !== "string" ||
        l.description.length > 3000
      )
        return json({ error: "Aula inválida no catálogo." }, 400);
      seen.add(l.id);
    }
    if (writes.has(user))
      return json(
        {
          error:
            "Há um envio em andamento. Verifique o GitHub antes de repetir.",
        },
        409,
      );
    writes.set(user, true);
    try {
      const old = await readCatalog(env);
      if ((d.sha ?? null) !== (old.sha ?? null))
        return json(
          {
            error:
              "O catálogo mudou no GitHub. Feche e reabra este painel para atualizar a versão antes de salvar.",
          },
          409,
        );
      const clean = {
        version: 1,
        lessons: d.lessons.map((l) => ({
          id: l.id,
          title: l.title.trim(),
          description: l.description,
        })),
      };
      const bytes = new TextEncoder().encode(JSON.stringify(clean, null, 2));
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      const payload = {
        message: "docs(course): update lesson subjects",
        content: btoa(binary),
        branch: env.GITHUB_BRANCH || "main",
      };
      if (old.sha) payload.sha = old.sha;
      const res = await fetch(ghPath(env), {
        method: "PUT",
        headers: { ...ghHeaders(env), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        return json(
          {
            error:
              res.status === 409
                ? "Conflito de versão. Atualize antes de salvar."
                : "GitHub recusou o envio. Verifique o repositório e as permissões.",
          },
          res.status === 409 ? 409 : 502,
        );
      const saved = await res.json();
      return json({ sha: saved.content.sha, commit: saved.commit.sha });
    } finally {
      writes.delete(user);
    }
  }
  return null;
}
