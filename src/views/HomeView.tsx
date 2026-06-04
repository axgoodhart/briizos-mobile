import { useState } from 'react';
import { ChevronDown, Plus, ArrowUp, Sparkles, Zap } from 'lucide-react';

export default function HomeView() {
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('GPT-5.4 mini');
  const [showModelMenu, setShowModelMenu] = useState(false);

  const models = ['GPT-5.4 mini', 'GPT-5.4', 'Claude 3.5', 'Claude 3.7'];

  return (
    <div style-id="stylo-311" className="h-full flex flex-col relative">
      {/* Main content area */}
      <div style-id="stylo-312" className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        {/* Chat input card */}
        <div style-id="stylo-313" className="w-full bg-[#1e1e35] border border-[#2a2a45] rounded-2xl p-4 mb-6">
          <textarea style-id="stylo-314"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="What can I do for you?"
          className="w-full bg-transparent text-white placeholder-gray-500 text-lg resize-none outline-none min-h-[80px]" />
          
          <div style-id="stylo-315" className="flex items-center gap-2 mt-2">
            {/* Zo icon */}
            <div style-id="stylo-316" className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center">
              <Zap style-id="stylo-317" size={16} className="text-purple-400" />
            </div>
            {/* Model selector */}
            <button style-id="stylo-318"
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2a2a45] text-sm text-gray-300">
              
              <Sparkles style-id="stylo-319" size={14} />
              {selectedModel}
              <ChevronDown style-id="stylo-320" size={14} />
            </button>
            <div style-id="stylo-321" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a2a45] text-sm">
              <span style-id="stylo-322" className="text-gray-300" id="connectionIndicator">API  🔑</span>
            </div>
            <div style-id="stylo-323" className="flex-1" />
            <button style-id="stylo-324" className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
              <Plus style-id="stylo-325" size={16} />
            </button>
            <button style-id="stylo-326" className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
              <ArrowUp style-id="stylo-327" size={16} />
            </button>
          </div>

          {showModelMenu &&
          <div style-id="stylo-328" className="absolute mt-2 bg-[#252540] border border-[#3a3a55] rounded-xl shadow-xl z-50 overflow-hidden">
              {models.map((m) =>
            <button style-id="stylo-329"
            key={m}
            onClick={() => {setSelectedModel(m);setShowModelMenu(false);}}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a45] hover:text-white">
              
                  {m}
                </button>
            )}
            </div>
          }
        </div>

        {/* History */}
        <div style-id="stylo-330" className="w-full">
          <h3 style-id="stylo-331" className="text-white font-medium mb-1">History</h3>
          <div style-id="stylo-332" className="flex items-stretch gap-6">
          <p style-id="stylo-333" className="text-gray-500 text-sm">Job Search</p>
          <p style-id="stylo-334" className="text-white text-sm" id="historyConversation">update profile landing</p>

          </div>
        </div>
      </div>

      {/* Footer links */}
      <div style-id="stylo-335" className="px-4 py-4 text-center">

        <div style-id="stylo-336" className="flex items-center justify-center gap-4 text-gray-500 text-sm mb-1">
          <span style-id="stylo-337" className="flex items-center gap-1" id="brandMuffin">briizOS</span>
        </div>
      </div>
    </div>);

}

/* function GridIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}*/