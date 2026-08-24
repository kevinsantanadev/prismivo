"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    const handleControllerChange = () => {
      if (!hadController || reloading || sessionStorage.getItem("prismivo-sw-v3-reloaded")) return;
      reloading = true;
      sessionStorage.setItem("prismivo-sw-v3-reloaded", "true");
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => undefined);

    return () => navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
  }, []);
  return null;
}
