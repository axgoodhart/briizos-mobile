import { useState } from 'react'
import { ChevronDown, Plus, ArrowUp, Sparkles, Globe, Mail, Zap } from 'lucide-react'

export default function HomePanel() {
  const [inputText, setInputText] = useState('')
  const [selectedModel, setSelectedModel] = useState('GPT-5.4 mini')
  const [showModelMenu, setShowModelMenu] = useState(false)

  const models = ['GPT-5.4 mini', 'GPT-5.4', 'Claude 3.5', 'Claude 3.7']

  return (
    <div className="h-full flex flex-col relative">
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        {/* Chat input card */}
        <div className="w-full bg-[#1e1e35] border border-[#2a2a45] rounded-2xl p-4 mb-6">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="What can I do for you?"
            className="w-full bg-transparent text-white placeholder-gray-500 text-lg resize-none outline-none min-h-[80px]"
          />
          <div className="flex items-center gap-2 mt-2">
            {/* Zo icon */}
            <div className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center">
              <Zap size={16} className="text-purple-400" />
            </div>
            {/* Model selector */}
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2a2a45] text-sm text-gray-300"
            >
              <Sparkles size={14} />
              {selectedModel}
              <ChevronDown size={14} />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a2a45] text-sm">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-gray-300">Free</span>
            </div>
            <div className="flex-1" />
            <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
              <Plus size={16} />
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
              <ArrowUp size={16} />
            </button>
          </div>

          {showModelMenu && (
            <div className="absolute mt-2 bg-[#252540] border border-[#3a3a55] rounded-xl shadow-xl z-50 overflow-hidden">
              {models.map(m => (
                <button
                  key={m}
                  onClick={() => { setSelectedModel(m); setShowModelMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a45] hover:text-white"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rewards */}
        <div className="w-full">
          <h3 className="text-white font-medium mb-1">Rewards</h3>
          <p className="text-gray-500 text-sm">Earn $10 / user</p>
        </div>
      </div>

      {/* Footer links */}
      <div className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-4 text-gray-500 text-sm mb-1">
          <span className="flex items-center gap-1"><Globe size={14} /> briizos.zo.computer</span>
          <span className="flex items-center gap-1"><GridIcon size={14} /> briizos.zo.space</span>
        </div>
        <span className="flex items-center justify-center gap-1 text-gray-500 text-sm">
          <Mail size={14} /> briizos@zo.computer
        </span>
      </div>
    </div>
  )
}

function GridIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}
