import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Card } from '../../components/common/Card.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useRegisterMutation } from '../../redux/api/authApi.js';
import { setCredentials } from '../../redux/slices/authSlice.js';
import { User, Mail, Lock, Sparkles, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');

  const [registerApi, { isLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      await registerApi({ name: name.trim(), email: email.trim(), password, role }).unwrap();
      toast.success('Registration successful! Please verify your email address (sent to your inbox) before logging in.', { duration: 6000 });
      navigate('/login');
    } catch (err) {
      const validationErrors = err?.data?.errors;
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        validationErrors.forEach((e) => toast.error(e.message || String(e)));
      } else {
        toast.error(err?.data?.message || 'Registration failed.');
      }
    }
  };

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
