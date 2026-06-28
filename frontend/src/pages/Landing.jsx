import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRightLeftIcon,
  BarChart3Icon,
  ClipboardListIcon,
  ScanLineIcon,
  ShieldCheckIcon,
  BellIcon,
} from '../components/Icons';

const FEATURES = [
  { icon: ScanLineIcon, title: 'QR Code Verification' },
  { icon: ArrowRightLeftIcon, title: 'Controlled Return/Receive' },
  { icon: BellIcon, title: 'Missing Document Alerts' },
  { icon: BarChart3Icon, title: 'Real-Time Heatmap' },
  { icon: ShieldCheckIcon, title: 'Role-Based Access' },
  { icon: ClipboardListIcon, title: 'Audit Trail Logs' },
];

export default function Landing() {
  const [mode, setMode] = useState('login');
  const authRef = useRef(null);

  const scrollToAuth = () => {
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAVBAR */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Swap this placeholder for the Sariaya seal image, e.g. <img src="/seal.png" className="h-11 w-11" /> */}
            <div className="h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              S
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-900 text-lg">QR-Track</p>
              <p className="text-xs text-slate-500 hidden sm:block">Municipality of Sariaya</p>
            </div>
          </div>

          <button
            onClick={scrollToAuth}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg px-5 py-2.5 transition-colors"
          >
            Sign in
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* AUTH CARD — first on mobile, right column on desktop */}
          <div ref={authRef} className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-xl border-t-4 border-blue-600 p-8 sm:p-10 max-w-lg mx-auto lg:mx-0 lg:ml-auto">
              {mode === 'login' ? (
                <LoginForm onSwitch={() => setMode('register')} />
              ) : (
                <RegisterForm onSwitch={() => setMode('login')} />
              )}
            </div>
          </div>

          {/* INTRO — second on mobile (scroll down), left column on desktop */}
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5">
              <ShieldCheckIcon className="w-4 h-4" /> Official Municipal Platform
            </span>

            <h1 className="mt-7 text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              All Documents.<br />
              <span className="text-blue-600">One System.</span>
            </h1>

            <p className="mt-6 text-slate-600 text-lg sm:text-xl leading-relaxed max-w-xl">
              A Progressive Web-Based Document Tracking and Workflow Management
              System for the Sariaya Office of the Municipal Administrator —
              secure, accountable, and seamless.
            </p>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
                  <span className="text-blue-600">
                    <f.icon className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-medium text-slate-700 leading-snug">{f.title}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex gap-12">
              <div>
                <p className="text-3xl font-bold text-blue-600">100%</p>
                <p className="text-xs text-slate-400 tracking-wide mt-1">DIGITAL</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">24/7</p>
                <p className="text-xs text-slate-400 tracking-wide mt-1">TRACKING</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">ISO</p>
                <p className="text-xs text-slate-400 tracking-wide mt-1">25010</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function LoginForm({ onSwitch }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'employee') navigate('/employee/dashboard');
      else navigate('/citizen/home');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
      <p className="text-slate-500 text-base mt-2">Sign in to access your dashboard.</p>

      {error && (
        <div className="mt-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <label className="block mt-6 text-sm font-semibold text-slate-700">Email address</label>
      <input
        type="email"
        name="email"
        required
        value={form.email}
        onChange={handleChange}
        placeholder="you@example.com"
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <label className="block mt-5 text-sm font-semibold text-slate-700">Password</label>
      <input
        type="password"
        name="password"
        required
        value={form.password}
        onChange={handleChange}
        placeholder="••••••••"
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex items-center justify-between mt-5 text-sm">
        <label className="flex items-center gap-2 text-slate-600">
          <input type="checkbox" className="rounded border-slate-300 w-4 h-4" />
          Remember me
        </label>
        <a href="#" className="text-blue-600 hover:underline font-medium">Forgot password?</a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-7 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-base rounded-lg py-3.5 transition-colors"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-blue-600 font-semibold hover:underline">
          Register
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSwitch }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm_password: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!agreed) {
      setError('Please agree to the Data Privacy Notice to continue.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      setSuccess('Account created successfully! You can now sign in.');
      setTimeout(onSwitch, 1500);
    } catch (err) {
      const data = err.response?.data;
      const firstError = data ? Object.values(data)[0] : null;
      setError(Array.isArray(firstError) ? firstError[0] : 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-3xl font-bold text-slate-900">Create citizen account</h2>
      <p className="text-slate-500 text-base mt-2">Register as a citizen to request and track your documents.</p>

      {error && (
        <div className="mt-5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-5 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700">First name</label>
          <input
            name="first_name" required value={form.first_name} onChange={handleChange}
            placeholder="Juan"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Last name</label>
          <input
            name="last_name" required value={form.last_name} onChange={handleChange}
            placeholder="Dela Cruz"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <label className="block mt-5 text-sm font-semibold text-slate-700">Email address</label>
      <input
        type="email" name="email" required value={form.email} onChange={handleChange}
        placeholder="you@example.com"
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="grid grid-cols-2 gap-4 mt-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Password</label>
          <input
            type="password" name="password" required value={form.password} onChange={handleChange}
            placeholder="••••••••"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Confirm</label>
          <input
            type="password" name="confirm_password" required value={form.confirm_password} onChange={handleChange}
            placeholder="••••••••"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <label className="flex items-start gap-3 mt-5 text-sm text-slate-500">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 rounded border-slate-300 w-4 h-4"
        />
        I agree to the Data Privacy Notice and consent to the processing of my
        personal information for municipal document services.
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-7 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-base rounded-lg py-3.5 transition-colors"
      >
        {loading ? 'Creating account…' : 'Create citizen account'}
      </button>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-blue-600 font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
}