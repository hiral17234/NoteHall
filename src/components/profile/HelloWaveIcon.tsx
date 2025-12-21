import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HelloWaveIconProps {
  show: boolean;
}

export function HelloWaveIcon({ show }: HelloWaveIconProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            rotate: [0, 20, -20, 20, -20, 0],
          }}
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          transition={{ 
            duration: 0.5,
            rotate: {
              duration: 1.5,
              repeat: 2,
              ease: "easeInOut"
            }
          }}
          className="absolute -right-4 -top-4 z-50"
        >
          <div className="relative">
            {/* 3D Effect Container */}
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-2xl"
              style={{
                background: "linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
                transform: "perspective(500px) rotateY(-10deg) rotateX(5deg)",
                boxShadow: `
                  4px 4px 0 hsl(var(--primary) / 0.5),
                  8px 8px 0 hsl(var(--primary) / 0.3),
                  0 15px 30px hsl(var(--primary) / 0.4)
                `
              }}
            >
              👋
            </div>
            {/* Sparkle effects */}
            <motion.div
              className="absolute -top-2 -right-2 text-yellow-400 text-lg"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              ✨
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -left-2 text-yellow-400 text-sm"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
            >
              ✨
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}