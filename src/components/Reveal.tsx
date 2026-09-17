"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Retardo en ms, para escalonar varios elementos. */
  delay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Aparición suave cuando el elemento entra en pantalla.
 * Si el navegador no soporta IntersectionObserver o el usuario pidió
 * menos movimiento, el contenido se muestra directamente.
 */
export default function Reveal({ children, delay = 0, as: Tag = "div", className = "" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      el.dataset.shown = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          window.setTimeout(() => {
            target.dataset.shown = "true";
          }, delay);
          observer.unobserve(target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} data-shown="false" className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}
