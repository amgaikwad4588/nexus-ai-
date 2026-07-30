// Shared framer-motion variants matching Bold Typography design system.
// Fast and decisive. No bouncy easing. No playful delays.
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0, 0, 1] },
  },
};

export const stagger = {
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
