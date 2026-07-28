import { Cloud, CloudOff, LoaderCircle, Wifi } from 'lucide-react';
import type { BriizOSMobileState, SyncStatus } from '../types/briizos';

interface SyncStatusStripProps {
  sync: BriizOSMobileState;
}

const labelMap: Record<SyncStatus, string> = {
  idle: 'Idle',
  authenticating: 'Checking session',
  'signed-out': 'Signed out',
  syncing: 'Syncing',
  ready: 'Live',
  error: 'Sync issue'
};

export default function SyncStatusStrip({ sync }: SyncStatusStripProps) {
  const Icon = sync.status === 'ready' ?
  Wifi :
  sync.status === 'signed-out' || sync.status === 'error' ?
  CloudOff :
  sync.status === 'syncing' || sync.status === 'authenticating' ?
  LoaderCircle :
  Cloud;

  const counts = [
  `${sync.organizer.length} org`,
  `${sync.events.length} events`,
  `${sync.tasks.length} tasks`,
  `${sync.timer ? 1 : 0} timer`].
  join(' / ');

  return (
    <div className="row-4">
      <span className="row-18" id="brandMuffin">briizOS</span>

      <Icon
        size={13}
        className={sync.status === 'syncing' || sync.status === 'authenticating' ? 'animate-spin text-cyan-300' : 'text-cyan-300'} />
      
      <span className="span-tone-2">{labelMap[sync.status]}</span>
      <span className="span-tone-3" />
      <span className="span-styled">{sync.error || counts}</span>

    </div>);

}