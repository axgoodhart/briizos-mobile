import { useState } from 'react'
import { Download, Filter, ArrowUpDown, Globe, Zap } from 'lucide-react'

interface Skill {
  id: string
  title: string
  description: string
  tags: string[]
  author: string
  icon: React.ReactNode
}

const skills: Skill[] = [
  {
    id: '1',
    title: 'Improve and optimize prompts for Claude using Anthropic\'s official best practices and the 5-Element Persona Framework. Use when asked to...',
    description: '',
    tags: ['AI', 'Content'],
    author: 'skeletorjs',
    icon: <div className="w-10 h-10 rounded-xl bg-[#2a2a45] flex items-center justify-center"><span className="text-lg">📝</span></div>
  },
  {
    id: '2',
    title: 'Create a site',
    description: 'Create a site hosted on your Zo server. Private by default, publish with a click.',
    tags: ['Web'],
    author: 'Zo',
    icon: <div className="w-10 h-10 rounded-xl bg-[#2a2a45] flex items-center justify-center"><Globe size={18} className="text-gray-400" /></div>
  },
  {
    id: '3',
    title: 'Install OpenClaw on Zo',
    description: 'Install and run OpenClaw on Zo Computer with Tailscale private networking, browser Control UI, and Zo MCP tools via mcporter. Use this skill...',
    tags: ['AI', 'Developer Tools'],
    author: 'skeletorjs',
    icon: <div className="w-10 h-10 rounded-xl bg-[#2a2a45] flex items-center justify-center"><span className="text-lg">🦞</span></div>
  }
]

export default function SkillsView() {
  const [activeTab, setActiveTab] = useState<'installed' | 'hub'>('hub')

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setActiveTab('installed')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm ${activeTab === 'installed' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
        >
          <Download size={14} /> Installed
        </button>
        <button
          onClick={() => setActiveTab('hub')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm ${activeTab === 'hub' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
        >
          <Zap size={14} /> Hub
        </button>
        <div className="flex-1" />
        <button className="zo-btn-icon"><Filter size={14} /></button>
        <button className="zo-btn-icon"><ArrowUpDown size={14} /></button>
      </div>

      {/* Skills list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {skills.map(skill => (
          <div key={skill.id} className="zo-card p-4">
            <div className="flex items-start gap-3">
              {skill.icon}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="text-white font-medium text-sm leading-snug">{skill.title}</h3>
                  <button className="zo-btn-icon ml-2 shrink-0">
                    <Download size={14} />
                  </button>
                </div>
                {skill.description && (
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed">{skill.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {skill.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-[#2a2a45] text-gray-400 text-xs">{tag}</span>
                    ))}
                  </div>
                  <span className="text-gray-500 text-xs">{skill.author}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
