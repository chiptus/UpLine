import * as React from "react";

import { cn } from "@/lib/utils";

// Card owns the id and hands it down, so any CardTitle rendered inside can
// self-label the section via aria-labelledby without an explicit id prop.
// The labelledby is only applied once a CardTitle actually registers itself —
// otherwise every plain Card (most of them have no title) becomes an unnamed
// "region" landmark, which is noise for screen readers and for role queries.
const CardTitleIdContext = React.createContext<{
  titleId: string;
  registerTitle: (present: boolean) => void;
} | null>(null);

const Card = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    const titleId = React.useId();
    const [hasTitle, setHasTitle] = React.useState(false);

    const registerTitle = React.useCallback((present: boolean) => {
      setHasTitle(present);
    }, []);

    const contextValue = React.useMemo(
      () => ({ titleId, registerTitle }),
      [titleId, registerTitle],
    );

    return (
      <CardTitleIdContext.Provider value={contextValue}>
        <section
          ref={ref}
          aria-labelledby={hasTitle ? titleId : undefined}
          className={cn(
            "rounded-lg border bg-card text-card-foreground shadow-sm",
            className,
          )}
          {...props}
        />
      </CardTitleIdContext.Provider>
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, id: idProp, ...props }, ref) => {
  const context = React.useContext(CardTitleIdContext);
  const id = idProp ?? context?.titleId;

  React.useLayoutEffect(() => {
    if (idProp || !context) return;
    context.registerTitle(true);
    return () => context.registerTitle(false);
  }, [idProp, context]);

  return (
    <h3
      ref={ref}
      id={id}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
