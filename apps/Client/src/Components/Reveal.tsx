import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "../utils/format";

type Props = {
  children: ReactNode;
  className?: string;
  /** Milliseconds to wait after scrolling into view, to stagger a row. */
  delay?: number;
  as?: "div" | "section" | "li";
};

// Fades its children up the first time they scroll into view. The animation
// itself is CSS (.reveal in App.css) and is skipped for people who ask their
// device for reduced motion.
export default function Reveal({ children, className, delay = 0, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Very old browsers: just show it.
    if (!("IntersectionObserver" in window)) {
      element.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cx("reveal", className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
