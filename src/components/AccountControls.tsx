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
      <section className="card">
        <div className="row-2">
          <div className="card-row-center">
            <UserRound size={17} className="userround-tone" />
          </div>
          <div className="div-size">
            <p className="small">{sync.email || 'Signed in'}</p>
            <p className="small-2">{sync.uid}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="card-row-center-2"
            title="Sign out">
            
            <LogOut size={16} />
          </button>
        </div>
        {message && <p className="small-3">{message}</p>}
      </section>);

  }

  return (
    <form onSubmit={handleSubmit} className="card-2">
      <div className="row-spread">
        <div>
          <p className="small-4">Account</p>
          <p className="small-5">Use the same login as Web.</p>
        </div>
        <button
          type="button"
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="card-small">
          
          {mode === 'sign-in' ? 'Create' : 'Sign in'}
        </button>
      </div>
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        placeholder="email"
        autoComplete="email"
        className="card-small-2" />
      
      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        type="password"
        placeholder="password"
        autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
        className="card-small-2" />
      
      <button
        type="submit"
        disabled={busy || !email.trim() || !password}
        className="card-row-center-small">
        
        <LogIn size={15} />
        {mode === 'sign-in' ? 'Sign in' : 'Create account'}
      </button>
      {message && <p className="small-6">{message}</p>}
    </form>);

}