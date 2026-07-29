import { Thumb } from "./ui";

// Реальна обкладинка (Supabase Storage) або плейсхолдер, якщо cover немає.
export function Cover({ src, className, label }: { src?: string | null; className?: string; label?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={label ?? ""} className={`${className ?? ""} object-cover`} loading="lazy" />;
  }
  return <Thumb className={className} label={label ?? ""} />;
}
