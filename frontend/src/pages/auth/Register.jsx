import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Card } from '../../components/common/Card.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useRegisterMutation, useVerifyOtpMutation } from '../../redux/api/authApi.js';
import { setCredentials } from '../../redux/slices/authSlice.js';
import { User, Mail, Lock, Sparkles, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');

  // OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [registerApi, { isLoading }] = useRegisterMutation();
  const [verifyOtpApi, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Client-side validations
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await registerApi({ name: name.trim(), email: email.trim(), password, role }).unwrap();
      setPendingToken(res.data.pendingToken);
      setShowOtpScreen(true);
      toast.success('Verification code sent to your email!');
    } catch (err) {
      const validationErrors = err?.data?.errors;
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        validationErrors.forEach((e) => toast.error(e.message || String(e)));
      } else {
        toast.error(err?.data?.message || 'Registration failed.');
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error('Verification code must be exactly 6 digits');
      return;
    }

    try {
      const res = await verifyOtpApi({ pendingToken, otp: otpCode }).unwrap();
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      toast.success('Email verified successfully! Welcome to the platform.');
      
      if (!res.data.user?.isOnboarded) {
        navigate('/onboarding');
      } else if (res.data.user.role === 'TEACHER') {
        navigate('/teacher-dashboard');
      } else if (res.data.user.role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Verification failed. Please check the code.');
    }
  };

  if (showOtpScreen) {
    return (
      <Card className="glass-card shadow-2xl border border-slate-800 p-8 text-slate-100 max-w-md mx-auto text-center">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-lg shadow-brand-500/20 text-white">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Verify Your Email</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              We sent a 6-digit verification code to <span className="font-semibold text-slate-200">{email}</span>. Please enter it below to complete sign up.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4 w-full">
            <Input
              label="Verification Code"
              type="text"
              placeholder="e.g. 123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center font-bold tracking-[8px] text-lg focus:tracking-[8px]"
              required
            />

            <Button type="submit" isLoading={isVerifying} className="w-full mt-2" size="lg">
              Verify & Complete Sign Up
            </Button>
          </form>

          <div className="flex items-center justify-between w-full text-xs text-slate-400 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowOtpScreen(false)}
              className="hover:text-slate-200 transition-colors font-medium"
            >
              ← Edit Email
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(null)}
              className="hover:text-brand-400 text-brand-500 transition-colors font-bold"
            >
              Resend OTP
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card shadow-2xl border border-slate-800 p-8 text-slate-100">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-lg shadow-brand-500/20 text-white mb-3">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">Create Account</h2>
        <p className="text-xs text-slate-400 mt-1">
          Join the AI-Powered Learning Community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          icon={User}
          placeholder="Ada Lovelace"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="ada@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Account Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                role === 'STUDENT'
                  ? 'bg-brand-600 border-brand-500 text-white shadow-md'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => setRole('TEACHER')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                role === 'TEACHER'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              👨‍🏫 Instructor
            </button>
          </div>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full mt-2" size="lg">
          Get Started Free
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </Card>
  );
};
