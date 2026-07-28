import { useState } from 'react';
import { Eye, Code, Share2, RefreshCw, MoreVertical, Lock, Zap } from 'lucide-react';

export default function SpaceView() {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  return (
    <div className="stack-3">
      {/* URL bar */}
      <div className="row-28">
        <div className="card-row-3">
          <Zap size={14} className="zap-tone" />
          <span className="small-20">briizosspace</span>
        </div>
        <span className="small-7">Home page</span>
        <div className="div-styled-2" />
        <div className="row-small-10">
          <Lock size={12} />
          <span>Private</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="row-spread-9">
        <button className="zo-btn-icon"><MenuIcon size={16} /></button>
        <div className="row-6">
          <button
            onClick={() => setViewMode('preview')}
            className={`row-small-11 ${viewMode === 'preview' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
            
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`row-small-11 ${viewMode === 'code' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
            
            <Code size={14} /> Code
          </button>
        </div>
        <div className="row-18">
          <button className="zo-btn-icon"><Share2 size={14} /></button>
          <button className="zo-btn-icon"><RefreshCw size={14} /></button>
          <button className="zo-btn-icon"><MoreVertical size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="scroll-2">
        <div className="zo-card div-spacing-11">
          <p className="p-tone">
            <span className="strong">What is this?</span> YourbriizOSSpace is a place where you can publish pages, APIs, and assets created bybriizOS. AskbriizOSto build something and it will appear here. You can ask it to create new pages, or even change this one.
          </p>
          <p className="p-spacing">
            Pages can be public (anyone can view) or private (only you). You control the visibility of each page.
          </p>
        </div>

        <div className="zo-card div-spacing-11">
          <p className="p-tone">
            For more complex or isolated projects, or if you need to use a custom domain, check out the accompanying <span className="strong">Hosting</span> tab in your briizOS.
          </p>
        </div>

        <p className="small-41">
          Click the <span className="strong">+ New</span> button in the top right of your briizOS, or just askbriizOSto make something!
        </p>
      </div>
    </div>);

}

function MenuIcon({ size }: {size?: number;}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="14" y2="12" />
      <line x1="4" y1="18" x2="10" y2="18" />
    </svg>);

}