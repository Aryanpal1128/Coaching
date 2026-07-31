import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useForgotPasswordMutation } from '../../redux/api/authApi.js';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [forgotPasswordApi, { isLoading, isSuccess }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPasswordApi({ email }).unwrap();
      toast.success('Reset link sent to your email!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send reset email.');
    }
  };

  return (
    <Card className="glass-card shadow-2xl border border-slate-800 p-8 text-slate-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Forgot Password?</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter your registered email to receive password reset instructions
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center text-xs text-emerald-400">
          Check your email for the reset instructions token link!
        </div>
      ) : (
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

          <Button type="submit" isLoading={isLoading} className="w-full mt-2" size="lg">
            Send Reset Instructions
          </Button>
        </form>
      )}

      <div className="mt-6 text-center text-xs">
        <Link to="/login" className="text-slate-400 hover:text-white inline-flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </Card>
  );
};
