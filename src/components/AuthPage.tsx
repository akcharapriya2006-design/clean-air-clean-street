import React, { useState, useEffect } from 'react';
import { type User } from '../types';
import { Mail, Lock, User as UserIcon, Shield, Eye, EyeOff, AlertTriangle, CheckCircle, Wind, UserCheck, Microscope } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onAuthSuccess: (user: User) => void;
  setTab: (tab: string) => void;
}

export default function AuthPage({ initialMode = 'login', onAuthSuccess, setTab }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Register Fields
  const [name, setName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirm, setRegConfirm] = useState<string>('');
  const [regRole, setRegRole] = useState<'citizen' | 'municipal' | 'researcher'>('citizen');
  const [regTerms, setRegTerms] = useState<boolean>(false);

  // Login Fields
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // UI States
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [regSuccess, setRegSuccess] = useState<boolean>(false);
  const [pwdStrength, setPwdStrength] = useState<number>(0);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
  }, [initialMode]);

  // Compute Password Strength
  useEffect(() => {
    let score = 0;
    if (regPassword.length >= 8) score++;
    if (regPassword.length >= 12) score++;
    if (/[A-Z]/.test(regPassword)) score++;
    if (/[0-9]/.test(regPassword)) score++;
    if (/[^A-Za-z0-9]/.test(regPassword)) score++;
    setPwdStrength(score);
  }, [regPassword]);

  const getPwdStrengthLabel = () => {
    if (!regPassword) return { text: 'Enter a password', color: 'text-slate-400', barBg: 'bg-slate-200' };
    switch (pwdStrength) {
      case 1: return { text: 'Weak / Insecure', color: 'text-red-600', barBg: 'bg-red-500' };
      case 2: return { text: 'Moderate', color: 'text-amber-600', barBg: 'bg-amber-500' };
      case 3: return { text: 'Strong', color: 'text-blue-600', barBg: 'bg-blue-600' };
      case 4:
      case 5: return { text: 'Extremely Secure', color: 'text-emerald-600', barBg: 'bg-emerald-500' };
      default: return { text: 'Weak', color: 'text-red-600', barBg: 'bg-red-500' };
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      // Success
      onAuthSuccess(data.user);
      if (rememberMe) {
        localStorage.setItem('aerowatch_user', JSON.stringify(data.user));
      }
      setTab('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !regEmail || !regPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (regPassword !== regConfirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (regPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!regTerms) {
      setErrorMsg('Please accept the Terms & Conditions.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: regEmail,
          password: regPassword,
          role: regRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Success
      setRegSuccess(true);
      setTimeout(() => {
        setRegSuccess(false);
        setMode('login');
        setLoginEmail(regEmail);
        setLoginPassword('');
        setName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirm('');
        setRegTerms(false);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pwdLabelInfo = getPwdStrengthLabel();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand logo link */}
      <button
        onClick={() => setTab('overview')}
        className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900 mb-6 focus:outline-none cursor-pointer"
      >
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
          <Wind className="h-5 w-5" />
        </div>
        <span>AeroWatch</span>
      </button>

      {/* Auth Form Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 text-center sm:text-3xl">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 text-center">
            {mode === 'login'
              ? 'Sign in to access your dashboard and monitoring tools.'
              : 'Join the neighborhood sensor fusion network.'}
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-none" />
            <span>{errorMsg}</span>
          </div>
        )}

        {regSuccess && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-xs text-green-700 text-center space-y-1">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
            <p className="font-bold">✓ Account created successfully!</p>
            <p className="text-slate-600">Stored in database. Redirecting to sign in...</p>
          </div>
        )}

        {mode === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 pl-10 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 shadow-sm"
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 pl-10 pr-10 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 shadow-sm"
                />
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 bg-white text-blue-600 focus:ring-0 cursor-pointer accent-blue-600 h-4 w-4"
                />
                Remember me
              </label>
              <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              Sign In
            </button>

            <p className="text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Create one free →
              </button>
            </p>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Singh"
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 pl-10 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 shadow-sm"
                  />
                  <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 pl-10 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 shadow-sm"
                  />
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 pl-10 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 shadow-sm"
                />
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>

              {/* Password strength bar */}
              <div className="space-y-1 pt-1">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${pwdLabelInfo.barBg} transition-all duration-300`}
                    style={{ width: `${(pwdStrength / 5) * 100}%` }}
                  />
                </div>
                <span className={`block font-mono text-[10px] font-bold ${pwdLabelInfo.color}`}>
                  {pwdLabelInfo.text}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 pl-10 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 shadow-sm"
                />
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Custom Roles Grid Selectors */}
            <div className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Account Role</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('citizen')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all cursor-pointer ${
                    regRole === 'citizen'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Reporter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('municipal')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all cursor-pointer ${
                    regRole === 'municipal'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Municipal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('researcher')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all cursor-pointer ${
                    regRole === 'researcher'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Microscope className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Researcher</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={regTerms}
                  onChange={(e) => setRegTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-0 cursor-pointer accent-blue-600 h-4 w-4 flex-none"
                />
                <span>
                  I agree to store my account securely in the database.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              Create Account
            </button>

            <p className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Sign in →
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
