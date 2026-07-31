import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/common/Card.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useResetPasswordMutation } from '../../redux/api/authApi.js';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [resetPasswordApi, { isLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPasswordApi({ token, newPassword }).unwrap();
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.data?.message || 'Password reset failed.');
    }
  };

  return (
    <Card className="glass-card shadow-2xl border border-slate-800 p-8 text-slate-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-400 mt-1">
          Set a new strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          icon={Lock}
          placeholder="At least 6 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <Button type="submit" isLoading={isLoading} className="w-full mt-2" size="lg">
          Update Password
        </Button>
      </form>
    </Card>
  );
};
