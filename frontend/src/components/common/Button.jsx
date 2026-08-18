import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-br from-brand-500 to-accent-500 text-white font-bold hover:opacity-90 focus:ring-accent-500 shadow-md shadow-brand-500/25',
    secondary:
      'bg-white/5 border border-white/10 text-[#F5F3FA] hover:bg-white/10 focus:ring-brand-500',
    outline:
      'border border-brand-500 text-theme-primary hover:bg-brand-500/10 hover:border-accent-500 bg-transparent focus:ring-brand-500',
    ghost:
      'text-[#8B85A3] hover:text-[#F5F3FA] hover:bg-white/5',
    danger:
      'bg-red-600/80 text-white hover:bg-red-700 focus:ring-red-500 shadow-md shadow-red-500/20'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};
