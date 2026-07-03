import { forwardRef, useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_WIDTH = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const AdminModal = forwardRef(function AdminModal({
  open,
  onClose,
  onCloseConfirmed,
  onReset,
  title,
  children,
  hasUnsavedChanges = false,
  maxWidth = 'md',
}, ref) {
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmRef = useRef(null);

  const doClose = useCallback(() => {
    onReset?.();
    onCloseConfirmed?.();
    onClose();
  }, [onReset, onClose, onCloseConfirmed]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowConfirm(true);
    } else {
      doClose();
    }
  }, [hasUnsavedChanges, doClose]);

  useImperativeHandle(ref, () => ({ handleClose }), [handleClose]);

  const handleDiscard = useCallback(() => {
    setShowConfirm(false);
    doClose();
  }, [doClose]);

  const handleContinueEditing = useCallback(() => {
    setShowConfirm(false);
  }, []);

  useEffect(() => {
    if (!open) { setShowConfirm(false); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showConfirm) {
          handleContinueEditing();
        } else {
          handleClose();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, showConfirm, handleClose, handleContinueEditing]);

  useEffect(() => {
    if (!showConfirm) return;
    const timer = setTimeout(() => confirmRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [showConfirm]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full ${MAX_WIDTH[maxWidth] || MAX_WIDTH.md} rounded-xl border border-border/50 bg-card/95 p-6 shadow-2xl backdrop-blur-xl mx-4`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{title}</h2>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>

          <AnimatePresence>
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              >
                <div className="absolute inset-0 bg-black/40" onClick={handleContinueEditing} />
                <motion.div
                  ref={confirmRef}
                  tabIndex={-1}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleContinueEditing();
                  }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Unsaved Changes</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        You have unsaved changes. If you close this window now, all entered information will be permanently lost.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleDiscard}>
                      Discard Changes
                    </Button>
                    <Button className="flex-1" onClick={handleContinueEditing} autoFocus>
                      Continue Editing
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default AdminModal;
