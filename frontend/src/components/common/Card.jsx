import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hover = true, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`bg-theme-card border border-theme-border rounded-2xl p-5 shadow-theme ${className}`}
    >
      {children}
    </motion.div>
  );
};
