import { useEffect, useState } from 'react'
import { getMobileSyncService } from '../services/mobileSyncService'
import type { BriizOSMobileState } from '../types/briizos'

const initialState: BriizOSMobileState = {
  uid: null,
  email: null,
  status: 'idle',
  error: null,
  windowStates: [],
  tasks: [],
  events: [],
  organizer: [],
  minStack: [],
  timer: null,
  lastUpdatedAt: null,
}

export function useBriizOSSync(): BriizOSMobileState {
  const [syncState, setSyncState] = useState<BriizOSMobileState>(initialState)

  useEffect(() => {
    const service = getMobileSyncService()
    const unsubscribe = service.subscribe(setSyncState)

    void service.start()

    return unsubscribe
  }, [])

  return syncState
}
