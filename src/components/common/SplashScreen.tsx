import { motion } from 'framer-motion';

export function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 1.2, duration: 0.4 }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-cv-bg"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cv-accent to-purple-500 text-2xl font-bold text-white shadow-2xl"
        >
          PY
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-semibold text-cv-text"
        >
          Python Studio
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-3 h-0.5 rounded-full bg-cv-accent"
        />
      </div>
    </motion.div>
  );
}
