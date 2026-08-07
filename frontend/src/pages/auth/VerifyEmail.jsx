import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useVerifyEmailMutation } from '../../redux/api/authApi.js';
import { setCredentials } from '../../redux/slices/authSlice.js';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [verifyEmail] = useVerifyEmailMutation();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const triggerVerification = async () => {
      if (!token) {
        if (active) {
          setStatus('error');
          setErrorMessage('Verification token is missing.');
        }
        return;
      }

      try {
        const res = await verifyEmail(token).unwrap();
        if (active) {
          dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
          setStatus('success');
          toast.success('Email verified successfully! Account created.');
          
          setTimeout(() => {
            if (active) {
              if (res.data.user.role === 'TEACHER') {
                navigate('/teacher-dashboard');
              } else if (res.data.user.role === 'ADMIN') {
                navigate('/admin-dashboard');
              } else {
                navigate('/dashboard');
              }
            }
          }, 3000);
        }
      } catch (err) {
        if (active) {
          setStatus('error');
          setErrorMessage(err?.data?.message || 'Verification failed. The link may have expired or already been used.');
        }
      }
    };

    triggerVerification();

    return () => {
      active = false;
    };
  }, [token, verifyEmail, dispatch, navigate]);

  return (
    <Card className="glass-card shadow-2xl border border-slate-800 p-8 text-slate-100 max-w-md mx-auto text-center">
      <div className="flex flex-col items-center justify-center space-y-6 py-6">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
            <h2 className="text-xl font-extrabold tracking-tight">Verifying Your Email</h2>
            <p className="text-xs text-slate-400">
              Please wait while we secure your account and build your profile...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-emerald-400">Email Verified!</h2>
            <p className="text-xs text-slate-400">
              Your account has been successfully created. Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="p-3 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-red-400">Verification Failed</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {errorMessage}
            </p>
            <Link to="/register" className="w-full pt-4 block">
              <Button variant="outline" className="w-full">
                Back to Sign Up
              </Button>
            </Link>
          </>
        )}
      </div>
    </Card>
  );
};
