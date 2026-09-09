import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../lib/firebase';
import { verifyTOTPCode } from '../lib/mfa';
import type { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  onContinueAsGuest: () => void;
  getUserProfileByEmail?: (email: string) => Promise<UserProfile | null>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onContinueAsGuest,
  getUserProfileByEmail
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'mfa_challenge'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pending user object waiting for MFA verification
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);

  if (!isOpen) return null;

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const user = await registerWithEmail(email, password, displayName);
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || email,
          displayName: displayName || email.split('@')[0],
          isAnonymous: false,
          preferences: {
            aiTone: 'empathetic',
            thinkingMode: false,
            enableSpeech: true,
            privacyAutoLockMinutes: 15
          },
          mfa: {
            enabled: false,
            method: 'totp'
          },
          createdAt: Date.now()
        };
        onSuccess(newProfile);
        onClose();
      } else {
        // Mode is Login
        const user = await loginWithEmail(email, password);

        // Check if user has MFA enabled in local profile or firestore
        let profile: UserProfile | null = null;
        if (getUserProfileByEmail) {
          profile = await getUserProfileByEmail(email);
        }

        // If local record doesn't exist, check local storage
        if (!profile) {
          const cached = localStorage.getItem(`savean_user_${user.uid}`);
          if (cached) profile = JSON.parse(cached);
        }

        // If MFA is enabled on this profile, challenge the user!
        if (profile?.mfa?.enabled && profile.mfa.secret) {
          setPendingUser(user);
          setPendingProfile(profile);
          setMode('mfa_challenge');
          setIsLoading(false);
          return;
        }

        // Otherwise complete login immediately
        const finalProfile: UserProfile = profile || {
          uid: user.uid,
          email: user.email || email,
          displayName: user.displayName || email.split('@')[0],
          isAnonymous: false,
          preferences: {
            aiTone: 'empathetic',
            thinkingMode: false,
            enableSpeech: true,
            privacyAutoLockMinutes: 15
          },
          mfa: {
            enabled: false,
            method: 'totp'
          },
          createdAt: Date.now()
        };
        onSuccess(finalProfile);
        onClose();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMessage(err.message?.replace('Firebase: ', '') || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Savean Explorer',
        photoURL: user.photoURL || undefined,
        isAnonymous: false,
        preferences: {
          aiTone: 'empathetic',
          thinkingMode: false,
          enableSpeech: true,
          privacyAutoLockMinutes: 15
        },
        mfa: {
          enabled: false,
          method: 'totp'
        },
        createdAt: Date.now()
      };
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      console.warn("Google sign in popup error:", err);
      setErrorMessage('Google popup sign-in was blocked or dismissed. You can use Email/Password or Continue as Guest.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!pendingProfile?.mfa?.secret) {
      setErrorMessage('MFA secret not found. Try logging in again.');
      return;
    }

    setIsLoading(true);
    try {
      const isCodeValid = await verifyTOTPCode(pendingProfile.mfa.secret, mfaCode);
      const isBackupCode = pendingProfile.mfa.backupCodes?.includes(mfaCode.trim().toUpperCase());

      if (isCodeValid || isBackupCode) {
        onSuccess(pendingProfile);
        onClose();
      } else {
        setErrorMessage('Invalid 6-digit verification code or backup code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand header */}
        <div className="text-center space-y-1 mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-sky-400 text-white shadow-lg shadow-indigo-500/25 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {mode === 'mfa_challenge'
              ? 'Two-Factor Verification'
              : mode === 'signup'
              ? 'Create your Savean Account'
              : 'Sign in to Savean'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {mode === 'mfa_challenge'
              ? 'Enter the 6-digit code from your authenticator app'
              : 'AI thought organizer & goal companion with encrypted storage'}
          </p>
        </div>

        {/* MFA Challenge Mode */}
        {mode === 'mfa_challenge' ? (
          <form onSubmit={handleMFAChallengeSubmit} className="space-y-4 text-xs">
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 p-3.5 flex items-start gap-2.5 text-indigo-950 dark:text-indigo-200">
              <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>MFA Protected Account:</strong> Please open Google Authenticator, Authy, or enter an emergency backup code.
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                6-Digit Security Code
              </label>
              <input
                type="text"
                maxLength={9}
                required
                autoFocus
                placeholder="123456 or XXXX-XXXX"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 p-3 text-center text-xl font-mono tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 p-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !mfaCode.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Verifying Code...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 pt-2"
            >
              ← Back to Sign In
            </button>
          </form>
        ) : (
          /* Login / Sign Up Mode */
          <div className="space-y-4">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={`flex-1 rounded-lg py-2 font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage('');
                }}
                className={`flex-1 rounded-lg py-2 font-medium transition-all ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
              <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] text-zinc-400 uppercase tracking-wider">
                or with email
              </span>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3 text-xs">
              {mode === 'signup' && (
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Mercer"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2 pl-9 pr-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2 pl-9 pr-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2 pl-9 pr-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 p-2.5 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition-all"
              >
                {isLoading
                  ? 'Processing...'
                  : mode === 'signup'
                  ? 'Create Account'
                  : 'Sign In'}
              </button>
            </form>

            {/* Quick Guest mode fallback */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onContinueAsGuest();
                  onClose();
                }}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                Explore Savean as Guest (Instant Access)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
