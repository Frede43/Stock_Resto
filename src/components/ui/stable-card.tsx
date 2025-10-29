import * as React from "react"
import { cn } from "@/lib/utils"

// Version simplifiée et stable des composants Card sans forwardRef
// pour éviter les problèmes de DOM avec React

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function StableCard({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-card transition-all duration-300 hover:shadow-elegant",
        className
      )}
      {...props}
    />
  );
}

export function StableCardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function StableCardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function StableCardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function StableCardContent({ className, ...props }: CardProps) {
  return (
    <div 
      className={cn("p-6 pt-0", className)} 
      {...props} 
    />
  );
}

export function StableCardFooter({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

// Aliases pour faciliter la migration
export const Card = StableCard;
export const CardHeader = StableCardHeader;
export const CardTitle = StableCardTitle;
export const CardDescription = StableCardDescription;
export const CardContent = StableCardContent;
export const CardFooter = StableCardFooter;
