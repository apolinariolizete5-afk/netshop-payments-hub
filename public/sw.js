/* Moza Empregos service worker — notificações (sem cache de app shell). */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Notificação disparada a partir da página.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "SHOW_NOTIFICATION") return;

  event.waitUntil(
    self.registration.showNotification(data.title || "Moza Empregos", {
      body: data.body || "Nova vaga publicada.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      vibrate: data.vibrate || [300, 120, 300],
      requireInteraction: true,
      tag: data.tag || "moza-" + Date.now(),
      data: { url: data.url || "/" },
    }),
  );
});

// Push real (opcional).
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Moza Empregos", {
      body: payload.body || "Nova notificação.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      vibrate: [300, 120, 300],
      requireInteraction: true,
      data: { url: payload.url || "/notificacoes" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  const absolute = new URL(target, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url === absolute && "focus" in client) return client.focus();
      }
      const existing = allClients[0];
      if (existing && "navigate" in existing) {
        await existing.focus();
        return existing.navigate(absolute);
      }
      if (self.clients.openWindow) return self.clients.openWindow(absolute);
    })(),
  );
});
