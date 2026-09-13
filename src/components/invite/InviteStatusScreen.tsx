import type { ReactNode } from "react";

export function InviteStatusScreen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app-gradient flex items-center justify-center p-4">
      <div className="text-center">{children}</div>
    </div>
  );
}
