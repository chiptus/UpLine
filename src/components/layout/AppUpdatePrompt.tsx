import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "@/components/ui/sonner";

const UPDATE_CHECK_INTERVAL_MS = 60_000;

export function AppUpdatePrompt() {
  const updateIntervalId = useRef<ReturnType<typeof setInterval>>();

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      clearInterval(updateIntervalId.current);
      updateIntervalId.current = setInterval(() => {
        registration.update();
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  const updateServiceWorkerRef = useRef(updateServiceWorker);
  updateServiceWorkerRef.current = updateServiceWorker;

  useEffect(() => {
    return () => clearInterval(updateIntervalId.current);
  }, []);

  useEffect(() => {
    if (!needRefresh) return;

    const liveDot = (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
    );

    const toastId = toast("New version available", {
      description: "Refresh to load it.",
      duration: Infinity,
      icon: liveDot,
      action: {
        label: "Refresh",
        onClick: () => updateServiceWorkerRef.current(true),
      },
    });

    return () => {
      toast.dismiss(toastId);
    };
  }, [needRefresh]);

  return null;
}
