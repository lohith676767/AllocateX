import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import RegionDetailContent from './RegionDetailContent';

export default function RegionDrawer({ regionId, onClose }: { regionId: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {regionId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-[1px]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-label="Region detail"
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-2xl overflow-y-auto border-l border-stone-200 bg-stone-50 shadow-popover"
          >
            <div className="sticky top-0 z-10 flex items-center justify-end border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur">
              <button
                onClick={onClose}
                aria-label="Close region detail"
                className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {regionId && <RegionDetailContent regionId={regionId} onNavigate={onClose} compact />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
