import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

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

    const { dismiss } = toast({
      title: "New version available",
      description: (
        <span className="flex items-center gap-2">
          {liveDot}
          Refresh to load it.
        </span>
      ),
      duration: Infinity,
      action: (
        <ToastAction
          altText="Refresh"
          onClick={() => updateServiceWorkerRef.current(true)}
        >
          Refresh
        </ToastAction>
      ),
    });

    return () => {
      dismiss();
    };
  }, [needRefresh]);

  return null;
}
