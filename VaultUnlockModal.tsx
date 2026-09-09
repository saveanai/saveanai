import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';

interface VaultUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onUnlock: (passphrase: string) => Promise<boolean>;
  onLock: () => void;
}

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onUnlock,
  onLock
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!passphrase.trim()) return;

    setIsProcessing(true);
    try {
      const success = await onUnlock(passphrase.trim());
      if (success) {
        setPassphrase('');
        onClose();
      } else {
        setErrorMsg('Incorrect passphrase or unable to decrypt vault.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-2 mb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
            {isUnlocked ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {isUnlocked ? 'Savean Vault is Unlocked' : 'Unlock Encrypted Vault'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {isUnlocked
              ? 'Your private notes, goals, and thoughts are actively decrypted locally in memory.'
              : 'Enter your zero-knowledge master passphrase to decrypt your private thoughts and reflections.'}
          </p>
        </div>

        {isUnlocked ? (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 p-3 text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>AES-256 GCM Key derived and active in secure memory.</span>
            </div>

            <button
              onClick={() => {
                onLock();
                onClose();
              }}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-2.5 font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              Lock Vault Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Vault Passphrase
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Enter vault passphrase..."
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 py-2 pl-9 pr-9 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Default demo passphrase is <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded font-mono">savean2026</code> (or any custom passphrase you set).
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isProcessing || !passphrase.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              {isProcessing ? 'Decrypting Vault...' : 'Unlock Vault'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
