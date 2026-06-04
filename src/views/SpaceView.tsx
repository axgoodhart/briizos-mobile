import { useState } from 'react';
import { Eye, Code, Share2, RefreshCw, MoreVertical, Lock, Zap } from 'lucide-react';

export default function SpaceView() {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  return (
    <div style-id="stylo-558" className="h-full flex flex-col bg-[#000]">
      {/* URL bar */}
      <div style-id="stylo-559" className="flex items-center gap-2 px-4 py-3">
        <div style-id="stylo-560" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e1e35] border border-[#2a2a45]">
          <Zap style-id="stylo-561" size={14} className="text-purple-400" />
          <span style-id="stylo-562" className="text-white text-sm">briizosspace</span>
        </div>
        <span style-id="stylo-563" className="text-gray-500 text-sm">Home page</span>
        <div style-id="stylo-564" className="flex-1" />
        <div style-id="stylo-565" className="flex items-center gap-1 text-gray-500 text-xs">
          <Lock style-id="stylo-566" size={12} />
          <span style-id="stylo-567">Private</span>
        </div>
      </div>

      {/* Toolbar */}
      <div style-id="stylo-568" className="flex items-center justify-between px-4 py-2">
        <button style-id="stylo-569" className="zo-btn-icon"><MenuIcon style-id="stylo-570" size={16} /></button>
        <div style-id="stylo-571" className="flex items-center gap-2">
          <button style-id="stylo-572"
          onClick={() => setViewMode('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${viewMode === 'preview' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
            
            <Eye style-id="stylo-573" size={14} /> Preview
          </button>
          <button style-id="stylo-574"
          onClick={() => setViewMode('code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${viewMode === 'code' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
            
            <Code style-id="stylo-575" size={14} /> Code
          </button>
        </div>
        <div style-id="stylo-576" className="flex items-center gap-1">
          <button style-id="stylo-577" className="zo-btn-icon"><Share2 style-id="stylo-578" size={14} /></button>
          <button style-id="stylo-579" className="zo-btn-icon"><RefreshCw style-id="stylo-580" size={14} /></button>
          <button style-id="stylo-581" className="zo-btn-icon"><MoreVertical style-id="stylo-582" size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div style-id="stylo-583" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div style-id="stylo-584" className="zo-card p-5">
          <p style-id="stylo-585" className="text-gray-300 leading-relaxed">
            <span style-id="stylo-586" className="text-white font-semibold">What is this?</span> Your Zo Space is a place where you can publish pages, APIs, and assets created by Zo. Ask Zo to build something and it will appear here. You can ask it to create new pages, or even change this one.
          </p>
          <p style-id="stylo-587" className="text-gray-300 leading-relaxed mt-4">
            Pages can be public (anyone can view) or private (only you). You control the visibility of each page.
          </p>
        </div>

        <div style-id="stylo-588" className="zo-card p-5">
          <p style-id="stylo-589" className="text-gray-300 leading-relaxed">
            For more complex or isolated projects, or if you need to use a custom domain, check out the accompanying <span style-id="stylo-590" className="text-white font-semibold">Hosting</span> tab in your Zo Computer.
          </p>
        </div>

        <p style-id="stylo-591" className="text-gray-400 text-sm text-center px-4">
          Click the <span style-id="stylo-592" className="text-white font-semibold">+ New</span> button in the top right of your Zo Computer, or just ask Zo to make something!
        </p>
      </div>
    </div>);

}

function MenuIcon({ size }: {size?: number;}) {
  return (
    <svg style-id="stylo-593" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line style-id="stylo-594" x1="4" y1="6" x2="20" y2="6" />
      <line style-id="stylo-595" x1="4" y1="12" x2="14" y2="12" />
      <line style-id="stylo-596" x1="4" y1="18" x2="10" y2="18" />
    </svg>);

}