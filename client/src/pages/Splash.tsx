import { motion } from 'framer-motion';
import { LogoMark } from '../components/Logo';

/**
 * Shown only while the initial /api/auth/me session check is in flight —
 * that request is fast, so this is a real loading state, not a staged
 * delay. Framer Motion's `initial` prop makes the entrance itself the only
 * animation; there's no timer holding the screen up.
 */
export default function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <LogoMark size="lg" />
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="mt-5 text-[22px] font-semibold tracking-tight text-stone-900"
        >
          FairFill
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="mt-1.5 text-[13px] text-stone-500"
        >
          Equitable CSR allocation, structurally enforced.
        </motion.p>
      </motion.div>
    </div>
  );
}
