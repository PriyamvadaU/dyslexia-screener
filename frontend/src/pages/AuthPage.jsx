import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sparkles, Lock, Mail, User, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('tab') === 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent'); // 'parent' | 'teacher' | 'educator'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setIsRegister(searchParams.get('tab') === 'register');
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        const res = await api.register(name.trim(), email.trim(), password, role);
        login(res.user, res.token);
      } else {
        const res = await api.login(email.trim(), password);
        login(res.user, res.token);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
          {isRegister ? 'Create Parent / Educator Account' : 'Welcome Back to LexiScreen'}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {isRegister 
            ? 'Set up your secure portal to administer child learning assessments' 
            : 'Access child screening records, practice sessions, and longitudinal trends'}
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-200 dark:border-zinc-700">
        
        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isRegister
                ? 'bg-white dark:bg-zinc-800 text-indigo-950 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isRegister
                ? 'bg-white dark:bg-zinc-800 text-indigo-950 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <User className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'parent', label: 'Parent / Guardian' },
                  { id: 'teacher', label: 'Teacher / Educator' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      role === r.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-900 dark:text-indigo-200'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isRegister ? 'Create Account & Continue' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Button */}
        <div className="mt-4 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                const res = await api.loginDemo();
                login(res.user, res.token);
                navigate('/dashboard');
              } catch (err) {
                setError(err.message || 'Demo login failed.');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Try Demo Account (Pre-populated Profile & Trends)</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-700/60 text-center">
          <p className="text-xs text-zinc-500">
            {isRegister ? 'Already registered?' : 'First time here?'}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isRegister ? 'Sign in instead' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>

      <MedicalDisclaimer compact />
    </div>
  );
}
