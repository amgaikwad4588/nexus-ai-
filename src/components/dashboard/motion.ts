// Shared framer-motion variants so every dashboard page animates identically.
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};
