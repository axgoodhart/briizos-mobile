import { useState, type FormEvent } from 'react';
import { LogIn, LogOut, UserRound } from 'lucide-react';
import { getMobileSyncService } from '../services/mobileSyncService';
import type { BriizOSMobileState } from '../types/briizos';

interface AccountControlsProps {
  sync: BriizOSMobileState;
}

export default function AccountControls({ sync }: AccountControlsProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const signedIn = Boolean(sync.uid);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const service = getMobileSyncService();
      if (mode === 'sign-up') {
        await service.signUp(email.trim(), password);
      } else {
        await service.signIn(email.trim(), password);
      }
      setPassword('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setMessage(null);

    try {
      await getMobileSyncService().signOut();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  if (signedIn) {
    return (
      <section style-id="stylo-17" className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3">
        <div style-id="stylo-18" className="flex items-center gap-3">
          <div style-id="stylo-19" className="w-9 h-9 rounded-xl bg-[#2a2a45] flex items-center justify-center">
            <UserRound style-id="stylo-20" size={17} className="text-cyan-200" />
          </div>
          <div style-id="stylo-21" className="min-w-0 flex-1">
            <p style-id="stylo-22" className="text-white text-sm font-medium truncate">{sync.email || 'Signed in'}</p>
            <p style-id="stylo-23" className="text-gray-500 text-xs truncate">{sync.uid}</p>
          </div>
          <button style-id="stylo-24"
          type="button"
          onClick={handleSignOut}
          disabled={busy}
          className="w-9 h-9 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-300 disabled:opacity-50"
          title="Sign out">
            
            <LogOut style-id="stylo-25" size={16} />
          </button>
        </div>
        {message && <p style-id="stylo-26" className="mt-2 text-xs text-red-300">{message}</p>}
      </section>);

  }

  return (
    <form style-id="stylo-27" onSubmit={handleSubmit} className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3 space-y-2">
      <div style-id="stylo-28" className="flex items-center justify-between">
        <div style-id="stylo-29">
          <p style-id="stylo-30" className="text-white text-sm font-medium">Account</p>
          <p style-id="stylo-31" className="text-gray-500 text-xs">Use the same login as Web.</p>
        </div>
        <button style-id="stylo-32"
        type="button"
        onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
        className="text-xs text-cyan-200 px-2 py-1 rounded-lg bg-[#2a2a45]">
          
          {mode === 'sign-in' ? 'Create' : 'Sign in'}
        </button>
      </div>
      <input style-id="stylo-33"
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      type="email"
      placeholder="email"
      autoComplete="email"
      className="w-full rounded-lg bg-[#000] border border-[#2a2a45] px-3 py-2 text-sm text-white outline-none" />
      
      <input style-id="stylo-34"
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      type="password"
      placeholder="password"
      autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
      className="w-full rounded-lg bg-[#000] border border-[#2a2a45] px-3 py-2 text-sm text-white outline-none" />
      
      <button style-id="stylo-35"
      type="submit"
      disabled={busy || !email.trim() || !password}
      className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2a2a45] px-3 py-2 text-sm text-white disabled:opacity-50">
        
        <LogIn style-id="stylo-36" size={15} />
        {mode === 'sign-in' ? 'Sign in' : 'Create account'}
      </button>
      {message && <p style-id="stylo-37" className="text-xs text-red-300">{message}</p>}
    </form>);

}