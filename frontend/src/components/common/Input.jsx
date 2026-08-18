import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  type = 'text',
  error,
  icon: Icon,
  placeholder,
  value,
  onChange,
  name,
  required = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B85A3]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-[#8B85A3]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={isPassword && showPassword ? 'text' : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b ${
            error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#C5A059]'
          } text-[#F5F3FA] placeholder-[#8B85A3]/50 placeholder:text-xs sm:placeholder:text-sm placeholder:truncate rounded-none py-2 ${
            Icon ? 'pl-8' : 'pl-0'
          } ${isPassword ? 'pr-8' : 'pr-0'} text-sm focus:outline-none focus:ring-0 transition-all ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-1 flex items-center text-[#8B85A3] hover:text-[#F5F3FA]"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
};
