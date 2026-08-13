import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Card } from '../../components/common/Card.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useLoginMutation, useGoogleLoginMutation } from '../../redux/api/authApi.js';
import { setCredentials } from '../../redux/slices/authSlice.js';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loginApi, { isLoading }] = useLoginMutation();
  const [googleLoginApi, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password.length === 0) {
      toast.error('Password is required');
      return;
    }

    try {
      const res = await loginApi({ email: email.trim(), password }).unwrap();
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      toast.success('Welcome back!');
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
      const validationErrors = err?.data?.errors;
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        validationErrors.forEach((e) => toast.error(e.message || String(e)));
      } else {
        toast.error(err?.data?.message || 'Login failed. Please check your credentials.');
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await googleLoginApi({ idToken: credentialResponse.credential }).unwrap();
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      toast.success('Welcome back with Google!');
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
      toast.error(err?.data?.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in failed.');
  };

  return (
    <Card className="glass-card shadow-2xl border border-slate-800 p-8 text-slate-100">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-lg shadow-brand-500/20 text-white mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">Welcome Back</h2>
        <p className="text-xs text-slate-400 mt-1">
          Sign in to your AI Coaching Platform account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
            <input type="checkbox" className="rounded bg-slate-800 border-slate-700 text-brand-500" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-brand-400 hover:underline font-semibold">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full mt-2" size="lg">
          Sign In
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
          <span className="bg-slate-900 px-3 text-slate-500">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap
          theme="filled_dark"
          shape="pill"
        />
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-400 font-bold hover:underline">
          Create Account
        </Link>
      </div>
    </Card>
  );
};
