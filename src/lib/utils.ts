import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLocation(location: string | null | undefined): string {
  if (!location) return "Remote";
  if (location.toLowerCase() === "remote" || location.toLowerCase() === "remote (us)") return "Remote (US)";

  // Standardize "City, ST" format
  const parts = location.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    // If we have City, State Name, Country -> City, State Code (if we can find it)
    // For now, let's just keep the first two parts to enforce "City, ST" (or "City, State")
    return `${parts[0]}, ${parts[1]}`;
  }
  
  return location;
}
