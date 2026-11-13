import React, { useEffect, useRef, useState } from 'react';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/** True once the element has scrolled into view (stays true). Visible immediately when observation is unavailable. */
export function useInView<T extends Element>(options: IntersectionObserverInit = { rootMargin: '0px 0px -10% 0px' }) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined' || prefersReducedMotion());

  useEffect(() => {
    if (inView || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(ref.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return { ref, inView };
}

type RevealProps = {
  as?: keyof JSX.IntrinsicElements;
  delay?: number;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, 'className' | 'children'>;

/** Fades and lifts its content in when scrolled into view. */
export const Reveal: React.FC<RevealProps> = ({ as = 'div', delay = 0, className = '', children, style, ...rest }) => {
  const { ref, inView } = useInView<HTMLElement>();
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      data-revealed={inView ? 'true' : 'false'}
      className={`reveal ${className}`}
      style={{ ...style, '--reveal-delay': `${delay}ms` } as React.CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
};

/** Tracks the pointer inside an element and exposes it as --mx / --my for spotlight effects. */
export function spotlightHandlers() {
  return {
    onPointerMove(e: React.PointerEvent<HTMLElement>) {
      const rect = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
    },
  };
}
