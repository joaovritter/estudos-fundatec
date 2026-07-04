'use client';

import { MotionConfig } from 'framer-motion';

// reducedMotion="user": Framer Motion desativa animações para quem
// prefere movimento reduzido (acessibilidade).
export default function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
