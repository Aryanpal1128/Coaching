import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hover = true, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-slate-950/50 ${className}`}
    >
      {children}
    </motion.div>
  );
};
