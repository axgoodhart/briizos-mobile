import { useState } from 'react'
import { Eye, Code, Share2, RefreshCw, MoreVertical, Lock, Zap } from 'lucide-react'

export default function SpaceView() {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      {/* URL bar */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e1e35] border border-[#2a2a45]">
          <Zap size={14} className="text-purple-400" />
          <span className="text-white text-sm">briizosspace</span>
        </div>
        <span className="text-gray-500 text-sm">Home page</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <Lock size={12} />
          <span>Private</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2">
        <button className="zo-btn-icon"><MenuIcon size={16} /></button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${viewMode === 'preview' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${viewMode === 'code' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
          >
            <Code size={14} /> Code
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="zo-btn-icon"><Share2 size={14} /></button>
          <button className="zo-btn-icon"><RefreshCw size={14} /></button>
          <button className="zo-btn-icon"><MoreVertical size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="zo-card p-5">
          <p className="text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">What is this?</span> Your Zo Space is a place where you can publish pages, APIs, and assets created by Zo. Ask Zo to build something and it will appear here. You can ask it to create new pages, or even change this one.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            Pages can be public (anyone can view) or private (only you). You control the visibility of each page.
          </p>
        </div>

        <div className="zo-card p-5">
          <p className="text-gray-300 leading-relaxed">
            For more complex or isolated projects, or if you need to use a custom domain, check out the accompanying <span className="text-white font-semibold">Hosting</span> tab in your Zo Computer.
          </p>
        </div>

        <p className="text-gray-400 text-sm text-center px-4">
          Click the <span className="text-white font-semibold">+ New</span> button in the top right of your Zo Computer, or just ask Zo to make something!
        </p>
      </div>
    </div>
  )
}

function MenuIcon({ size }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="14" y2="12" />
      <line x1="4" y1="18" x2="10" y2="18" />
    </svg>
  )
}
