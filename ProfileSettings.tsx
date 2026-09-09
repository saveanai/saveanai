import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  Sparkles,
  Download,
  Trash2,
  Check,
  Copy,
  LogOut,
  Sliders,
  RefreshCw,
  Eye,
  EyeOff,
  QrCode,
  Smartphone
} from 'lucide-react';
import type { UserProfile, UserPreferences } from '../types';
import {
  generateTOTPSecret,
  verifyTOTPCode,
  generateBackupCodes,
  getOTPAuthURI,
  generateCurrentTOTP
} from '../lib/mfa';

interface ProfileSettingsProps {
  user: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onLogout: () => Promise<void>;
  isVaultUnlocked: boolean;
  onUnlockVault: (passphrase: string) => Promise<boolean>;
  onLockVault: () => void;
  onChangeVaultPassphrase: (oldPass: string, newPass: string) => Promise<boolean>;
  onExportAllData: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  user,
  onUpdateProfile,
  onLogout,
  isVaultUnlocked,
  onUnlockVault,
  onLockVault,
  onChangeVaultPassphrase,
  onExportAllData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'mfa' | 'encryption' | 'ai'>('profile');

  // Profile form state
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [focusAreas, setFocusAreas] = useState<string[]>(
    user.focusAreas || ['Mindset Clarity', 'Goal Execution', 'Daily Habits']
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Preferences form state
  const [preferences, setPreferences] = useState<UserPreferences>(
    user.preferences || {
      aiTone: 'empathetic',
      thinkingMode: false,
      enableSpeech: true,
      privacyAutoLockMinutes: 15
    }
  );

  // MFA Enrollment Wizard state
  const [isSettingUpMFA, setIsSettingUpMFA] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaVerificationInput, setMfaVerificationInput] = useState('');
  const [mfaVerificationError, setMfaVerificationError] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [simulatedCurrentCode, setSimulatedCurrentCode] = useState<string | null>(null);

  // Encryption Vault change passphrase state
  const [oldPassphrase, setOldPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [passphraseStatusMsg, setPassphraseStatusMsg] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile({
      displayName,
      bio,
      focusAreas,
      preferences
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Start MFA enrollment
  const handleStartMFAEnrollment = async () => {
    const secret = generateTOTPSecret();
    const codes = generateBackupCodes(8);
    setMfaSecret(secret);
    setMfaBackupCodes(codes);
    setIsSettingUpMFA(true);
    setMfaVerificationInput('');
    setMfaVerificationError('');

    // Generate current code preview so user can test immediately in web app
    const currentTestCode = await generateCurrentTOTP(secret);
    setSimulatedCurrentCode(currentTestCode);
  };

  // Verify and complete MFA enrollment
  const handleVerifyAndEnableMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaVerificationError('');

    const isValid = await verifyTOTPCode(mfaSecret, mfaVerificationInput);
    if (!isValid) {
      setMfaVerificationError('Invalid 6-digit code. Please verify your authenticator token.');
      return;
    }

    // Save MFA settings
    await onUpdateProfile({
      mfa: {
        enabled: true,
        method: 'totp',
        secret: mfaSecret,
        backupCodes: mfaBackupCodes,
        verifiedAt: Date.now()
      }
    });

    setIsSettingUpMFA(false);
  };

  // Disable MFA
  const handleDisableMFA = async () => {
    if (confirm('Are you sure you want to disable Multi-Factor Authentication? Your account will only be protected by your password.')) {
      await onUpdateProfile({
        mfa: {
          enabled: false,
          method: 'totp',
          secret: undefined,
          backupCodes: undefined
        }
      });
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(mfaSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(mfaBackupCodes.join('\n'));
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  const handleChangePassphraseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassphrase) return;

    const ok = await onChangeVaultPassphrase(oldPassphrase, newPassphrase);
    if (ok) {
      setPassphraseStatusMsg('Vault passphrase updated successfully!');
      setOldPassphrase('');
      setNewPassphrase('');
      setTimeout(() => setPassphraseStatusMsg(''), 3000);
    } else {
      setPassphraseStatusMsg('Failed to update passphrase. Verify old passphrase.');
    }
  };

  const otpauthUri = mfaSecret
    ? getOTPAuthURI(mfaSecret, user.email || 'user@savean.ai')
    : '';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 bg-zinc-50/50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Account & Preferences
            </h1>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Manage your personal identity, Multi-Factor Authentication (MFA), encrypted vault, and Savean AI parameters.
            </p>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-3.5 py-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors self-start sm:self-auto"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all ${
              activeSubTab === 'profile'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile & Focus</span>
          </button>

          <button
            id="subtab-mfa"
            onClick={() => setActiveSubTab('mfa')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all ${
              activeSubTab === 'mfa'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Multi-Factor Auth (MFA)</span>
            {user.mfa?.enabled && (
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            id="subtab-encryption"
            onClick={() => setActiveSubTab('encryption')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all ${
              activeSubTab === 'encryption'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Lock className="h-4 w-4 text-indigo-500" />
            <span>Encrypted Storage</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ai')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all ${
              activeSubTab === 'ai'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span>AI Personality</span>
          </button>
        </div>

        {/* Tab 1: Profile & Focus Areas */}
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                User Details
              </h2>

              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 text-2xl font-bold text-white shadow-md">
                  {displayName ? displayName[0].toUpperCase() : 'U'}
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {displayName || 'Guest User'}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {user.email || 'guest@savean.local'}
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-400">
                    {user.isAnonymous ? 'Guest Exploration' : 'Cloud Synchronized'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email || 'guest@savean.local'}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Personal Motto / North Star
                </label>
                <input
                  type="text"
                  placeholder="e.g. Relentless clarity, disciplined action."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="text-xs">
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Active Focus Areas
                </label>
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map((area, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
                    >
                      <span>{area}</span>
                      <button
                        type="button"
                        onClick={() => setFocusAreas(focusAreas.filter((_, i) => i !== idx))}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {savedSuccess ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="h-4 w-4" /> Profile settings saved!
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Multi-Factor Authentication (MFA / 2FA) */}
        {activeSubTab === 'mfa' && (
          <div className="space-y-5">
            {/* MFA Status Banner */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-2xl ${user.mfa?.enabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}`}>
                    {user.mfa?.enabled ? (
                      <ShieldCheck className="h-6 w-6" />
                    ) : (
                      <ShieldAlert className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        Multi-Factor Authentication (MFA)
                      </h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        user.mfa?.enabled
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      }`}>
                        {user.mfa?.enabled ? 'Active & Protected' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
                      Protect your organized thoughts, personal goals, and private reflections by requiring a second authentication step (TOTP Authenticator code) during login.
                    </p>
                  </div>
                </div>

                <div>
                  {user.mfa?.enabled ? (
                    <button
                      onClick={handleDisableMFA}
                      className="rounded-xl border border-red-300 dark:border-red-800 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      Disable MFA
                    </button>
                  ) : (
                    <button
                      onClick={handleStartMFAEnrollment}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                    >
                      Enable MFA (TOTP)
                    </button>
                  )}
                </div>
              </div>

              {/* If MFA is active, display backup codes info */}
              {user.mfa?.enabled && (
                <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Emergency Recovery Backup Codes
                    </span>
                    <button
                      onClick={() => alert("Keep your backup codes stored in a secure password manager.")}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Backup Codes Stored
                    </button>
                  </div>
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-3 text-xs text-zinc-600 dark:text-zinc-400">
                    If you lose access to your authenticator app, you can use your one-time recovery codes to sign in.
                  </div>
                </div>
              )}
            </div>

            {/* MFA Setup Wizard modal / container */}
            {isSettingUpMFA && (
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 p-6 shadow-md space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                      Set Up Two-Factor Authenticator (TOTP)
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsSettingUpMFA(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-600"
                  >
                    Cancel
                  </button>
                </div>

                {/* Step 1: Scan or copy code */}
                <div className="space-y-3 text-xs">
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Step 1: Add Savean to your Authenticator App
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Open Google Authenticator, Authy, or 1Password. Enter the secret key below, or use the simulated live token below for instant in-app verification:
                  </p>

                  <div className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60">
                    <code className="font-mono text-sm tracking-wider font-bold text-indigo-600 dark:text-indigo-400 flex-1 select-all">
                      {mfaSecret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 shadow-xs"
                    >
                      {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedSecret ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>

                  {/* Simulated current code helper */}
                  {simulatedCurrentCode && (
                    <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 p-3 text-xs text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
                      <div>
                        <strong>Live OTP Preview:</strong> Use code <code className="font-mono font-bold bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">{simulatedCurrentCode}</code> to test right now!
                      </div>
                      <button
                        type="button"
                        onClick={() => setMfaVerificationInput(simulatedCurrentCode)}
                        className="text-[11px] underline font-medium text-indigo-700 dark:text-indigo-300"
                      >
                        Auto-fill code
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 2: Backup codes */}
                <div className="space-y-3 text-xs pt-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Step 2: Save Emergency Recovery Codes
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyBackupCodes}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {copiedBackupCodes ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedBackupCodes ? 'Copied All' : 'Copy Codes'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 font-mono text-[11px] p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                    {mfaBackupCodes.map((code, idx) => (
                      <div key={idx} className="p-1 rounded bg-white dark:bg-zinc-900 text-center font-medium">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Verification form */}
                <form onSubmit={handleVerifyAndEnableMFA} className="space-y-3 text-xs pt-2">
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Step 3: Enter 6-Digit Code to Confirm
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={mfaVerificationInput}
                      onChange={(e) => setMfaVerificationInput(e.target.value.replace(/\D/g, ''))}
                      className="w-48 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-center text-lg font-mono tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={mfaVerificationInput.length !== 6}
                      className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Verify & Activate MFA
                    </button>
                  </div>
                  {mfaVerificationError && (
                    <p className="text-xs text-red-500">{mfaVerificationError}</p>
                  )}
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Encrypted Storage Vault */}
        {activeSubTab === 'encryption' && (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Zero-Knowledge Encrypted Storage (AES-256 GCM)
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Your sensitive thoughts, journal reflections, and goal strategies are encrypted on your device using PBKDF2 key derivation and AES-GCM 256.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isVaultUnlocked ? (
                  <button
                    onClick={onLockVault}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Lock Vault</span>
                  </button>
                ) : (
                  <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 px-2.5 py-1 text-xs font-medium">
                    Vault Locked
                  </span>
                )}
              </div>
            </div>

            {/* Change Passphrase Form */}
            <form onSubmit={handleChangePassphraseSubmit} className="space-y-3 text-xs pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
                Change Master Encryption Passphrase
              </h3>
              <p className="text-zinc-500">
                This passphrase derives your local AES key. We never store this key on our servers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
                    Current Passphrase
                  </label>
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    placeholder="Enter current passphrase"
                    value={oldPassphrase}
                    onChange={(e) => setOldPassphrase(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
                    New Master Passphrase
                  </label>
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    placeholder="Enter new strong passphrase"
                    value={newPassphrase}
                    onChange={(e) => setNewPassphrase(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
                >
                  {showPassphrase ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showPassphrase ? 'Hide' : 'Show'} passphrases</span>
                </button>

                <button
                  type="submit"
                  disabled={!newPassphrase}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  Update Passphrase
                </button>
              </div>

              {passphraseStatusMsg && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium pt-1">
                  {passphraseStatusMsg}
                </p>
              )}
            </form>

            {/* Export data */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Export All Personal Data
                </div>
                <div className="text-[11px] text-zinc-500">
                  Download a complete backup JSON containing your chats, goals, and daily progress logs.
                </div>
              </div>

              <button
                onClick={onExportAllData}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export JSON Archive</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: AI Personality Preferences */}
        {activeSubTab === 'ai' && (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Savean AI Companion Preferences
            </h2>

            {/* Tone Selector */}
            <div className="space-y-2 text-xs">
              <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                Assistant Conversational Tone
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'empathetic', title: 'Empathetic & Reflective', desc: 'Validates mental noise, offers mindful clarity and gentle guidance.' },
                  { id: 'direct', title: 'Direct & Action-Oriented', desc: 'No fluff. Cuts straight to actionable milestones and sequencing.' },
                  { id: 'socratic', title: 'Socratic Coach', desc: 'Asks sharp questions to prompt self-discovery and independent decisions.' },
                  { id: 'strategic', title: 'Strategic Mentor', desc: 'Analyzes high-level systems, risk mitigation, and long-term leverage.' }
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setPreferences({ ...preferences, aiTone: tone.id as any })}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      preferences.aiTone === tone.id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500 text-indigo-950 dark:text-indigo-200'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="font-semibold">{tone.title}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{tone.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Thinking mode default toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <div>
                <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Always Enable Thinking Mode
                </div>
                <div className="text-[11px] text-zinc-500">
                  Allocates deeper cognitive reflection on every user prompt.
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.thinkingMode}
                onChange={(e) => setPreferences({ ...preferences, thinkingMode: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
              />
            </div>

            {/* Speech synthesis toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <div>
                <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Text-to-Speech (TTS) Voice Affordance
                </div>
                <div className="text-[11px] text-zinc-500">
                  Enables audio listen buttons on Savean responses.
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.enableSpeech}
                onChange={(e) => setPreferences({ ...preferences, enableSpeech: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
              />
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onUpdateProfile({ preferences });
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 2000);
                }}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
