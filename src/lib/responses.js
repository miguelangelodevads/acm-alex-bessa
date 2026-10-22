export const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "private, no-store",
};
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...security, "content-type": "application/json; charset=utf-8" },
  });
}
