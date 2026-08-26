import { Suspense, type ComponentType, type ReactNode } from "react";

export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback: ReactNode = null,
) {
  return function WithSuspense(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}
