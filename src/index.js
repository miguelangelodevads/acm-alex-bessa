import { json, security } from "./lib/responses.js";
import { handleMedia } from "./routes/media.js";
import { handleGithub } from "./routes/github.js";

const contentSecurityPolicy =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; frame-src https://drive.google.com; media-src 'self'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'self'";
const assets = new Set([
  "/",
  "/css/styles.css",
  "/js/app.js",
  "/data/course.js",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons/acme-180.png",
  "/icons/acme-192.png",
  "/icons/acme-512.png",
  "/icons/acme-maskable-512.png",
]);

// Route requests before serving static files, including API and media errors.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (
        path.startsWith("/media/") &&
        ["GET", "HEAD"].includes(request.method)
      ) {
        return await handleMedia(request, path);
      }
      const api = await handleGithub(request, env, url);
      if (api) return api;
      if (assets.has(path) && ["GET", "HEAD"].includes(request.method)) {
        const response = await env.ASSETS.fetch(request);
        const headers = new Headers(response.headers);
        for (const [key, value] of Object.entries(security))
          headers.set(key, value);
        if (path === "/")
          headers.set("Content-Security-Policy", contentSecurityPolicy);
        if (path === "/sw.js") {
          headers.set("Service-Worker-Allowed", "/");
          headers.set("Cache-Control", "private, no-cache");
        }
        if (path === "/manifest.webmanifest")
          headers.set("Cache-Control", "private, no-cache");
        if (path.startsWith("/icons/"))
          headers.set("Cache-Control", "private, max-age=86400");
        return new Response(response.body, {
          status: response.status,
          headers,
        });
      }
      return json({ error: "Página não encontrada." }, 404);
    } catch {
      return json(
        {
          error:
            "Não foi possível concluir a operação. Verifique o estado antes de tentar novamente.",
        },
        502,
      );
    }
  },
};
