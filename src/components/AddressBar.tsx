import { Lock, RefreshCw, Monitor } from 'lucide-react'

interface AddressBarProps {
  domain: string
}

export default function AddressBar({ domain }: AddressBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-[#1e1e35]">
      <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-white">
        <Monitor size={16} />
      </button>
      <div className="flex-1 flex items-center gap-2 bg-[#2a2a45] rounded-xl px-3 py-2">
        <Lock size={14} className="text-gray-400" />
        <span className="text-gray-300 text-sm">{domain}</span>
      </div>
      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400">
        <RefreshCw size={16} />
      </button>
    </div>
  )
}
