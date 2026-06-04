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
    <div style-id="stylo-43" className="flex items-center gap-2 px-3 py-1.5 bg-[#121222] border-b border-[#252540] text-[11px] text-gray-400">
      <Icon style-id="stylo-44"
      size={13}
      className={sync.status === 'syncing' || sync.status === 'authenticating' ? 'animate-spin text-cyan-300' : 'text-cyan-300'} />
      
      <span style-id="stylo-45" className="text-gray-200">{labelMap[sync.status]}</span>
      <span style-id="stylo-46" className="h-3 w-px bg-[#2a2a45]" />
      <span style-id="stylo-47" className="truncate">{sync.error || counts}</span>
    </div>);

}