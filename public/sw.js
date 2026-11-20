const CACHE = "pelan-shell-v2";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          "/icon.svg",
          "/icon-192.png",
          "/icon-512.png",
          "/manifest.webmanifest",
          "/fonts/poppins-latin-400.woff2",
          "/fonts/poppins-latin-500.woff2",
          "/fonts/poppins-latin-600.woff2",
          "/fonts/poppins-latin-700.woff2",
          "/fonts/poppins-latin-800.woff2",
        ]),
      ),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("pelan-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin ||
    new URL(event.request.url).pathname.startsWith("/api")
  )
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (
          response.ok &&
          (event.request.mode === "navigate" ||
            /\/assets\/|\/fonts\/|\/icon\.svg|\/manifest\.webmanifest/.test(
              new URL(event.request.url).pathname,
            ))
        ) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          const home = await caches.match("/");
          if (home) return home;
        }
        return Response.error();
      }),
  );

  // --- TAMBAHKAN DI BAGIAN BAWAH public/sw.js ---

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "pelan. — Selangkah sebelum jam rawan";
  const options = {
    body: data.body || "15 menit lagi jam rawan. Siap aktifkan Mode Misi Basecamp?",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "pelan-reminder",
    renotify: true,
    data: {
      url: data.url || "/?mode=mission",
      scheduleTime: data.scheduleTime || "13:30",
    },
    actions: [
      { action: "start-mission", title: "Mulai Misi" },
      { action: "log-cig", title: "Catat 1 Batang" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    event.action === "log-cig"
      ? "/?action=log-cig"
      : event.action === "start-mission"
        ? "/?action=start-mission"
        : event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
});
