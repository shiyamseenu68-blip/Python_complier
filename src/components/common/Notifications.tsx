import { useIDEStore } from '../../store/ideStore';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ICONS = {
  success: { icon: CheckCircle, color: 'text-cv-success', border: 'border-cv-success/30' },
  error: { icon: AlertCircle, color: 'text-cv-error', border: 'border-cv-error/30' },
  info: { icon: Info, color: 'text-cv-accent', border: 'border-cv-accent/30' },
  warning: { icon: AlertTriangle, color: 'text-cv-warning', border: 'border-cv-warning/30' },
};

export function Notifications() {
  const { notifications, dismissNotification } = useIDEStore();

  return (
    <div className="fixed bottom-8 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.map(n => {
          const { icon: Icon, color, border } = ICONS[n.type];
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className={`flex items-start gap-2 rounded-xl border ${border} bg-cv-surface/95 px-4 py-3 shadow-2xl backdrop-blur-xl min-w-64 max-w-sm`}
            >
              <Icon size={16} className={`${color} mt-0.5 shrink-0`} />
              <div className="flex-1">
                <div className="text-xs font-semibold text-cv-text">{n.title}</div>
                {n.message && <div className="mt-0.5 text-xs text-cv-muted">{n.message}</div>}
              </div>
              <button onClick={() => dismissNotification(n.id)} className="text-cv-muted hover:text-cv-text">
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
