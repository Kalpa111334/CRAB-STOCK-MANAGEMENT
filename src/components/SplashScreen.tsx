import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: { 
              duration: 0.5,
              type: "spring",
              damping: 10,
              stiffness: 100
            }
          }}
          exit={{ 
            opacity: 0, 
            scale: 1.2,
            transition: { 
              duration: 0.3 
            }
          }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-primary via-accent to-primary-glow flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              initial={{ rotate: -10, scale: 0.7 }}
              animate={{ 
                rotate: 0, 
                scale: 1,
                transition: { 
                  duration: 0.8,
                  type: "spring",
                  damping: 5,
                  stiffness: 200
                }
              }}
              className="w-32 h-32 sm:w-48 sm:h-48 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm"
            >
              <span className="text-6xl sm:text-8xl">🦀</span>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                transition: { 
                  delay: 0.3,
                  duration: 0.5 
                }
              }}
              className="text-3xl sm:text-4xl font-bold text-white mb-2"
            >
              Crab Stock Guardian
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                transition: { 
                  delay: 0.5,
                  duration: 0.5 
                }
              }}
              className="text-sm sm:text-base text-white/80"
            >
              Professional Mud Crab Management
            </motion.p>

            {/* Animated loading indicator */}
            <motion.div 
              className="mt-8 flex justify-center items-center"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                transition: { 
                  delay: 0.7,
                  duration: 0.5 
                }
              }}
            >
              <div className="w-12 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ 
                    x: '100%',
                    transition: { 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }
                  }}
                  className="h-full w-1/3 bg-white/80 rounded-full"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen; 