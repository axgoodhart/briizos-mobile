import { useState } from 'react'
import {
  ChevronLeft, Sun, Moon, Monitor, Check,
  MessageCircle, Puzzle, Paintbrush, Grid3X3, User,
  Plus
} from 'lucide-react'

export default function SettingsView() {
  const [activeSubTab, setActiveSubTab] = useState<'channels' | 'integrations' | 'ux' | 'advanced' | 'account'>('ux')

  const subTabs = [
    { id: 'channels' as const, label: 'Channels', icon: MessageCircle },
    { id: 'integrations' as const, label: 'Integrations', icon: Puzzle },
    { id: 'ux' as const, label: 'UX', icon: Paintbrush },
    { id: 'advanced' as const, label: 'Advanced', icon: Grid3X3 },
    { id: 'account' as const, label: 'Account', icon: User },
  ]

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#252540]">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 text-gray-400 px-3 py-1.5 rounded-lg border border-[#2a2a45]">
            <ChevronLeft size={14} /> Back
          </button>
        </div>
        <button className="px-4 py-1.5 rounded-full bg-[#6b6b9e] text-white text-sm">
          Save
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto border-b border-[#252540]">
        {subTabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs min-w-[60px] transition-all ${
                activeSubTab === tab.id
                  ? 'bg-[#2a2a45] text-white'
                  : 'text-gray-500'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSubTab === 'ux' && <UXSettings />}
        {activeSubTab === 'integrations' && <IntegrationsSettings />}
        {activeSubTab === 'advanced' && <AdvancedSettings />}
        {activeSubTab === 'account' && <AccountSettings />}
        {activeSubTab === 'channels' && <ChannelsSettings />}
      </div>
    </div>
  )
}

function UXSettings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')
  const [activeTheme] = useState('Intermezzo')

  const themes = [
    { name: 'Root Zone', color: '#5eead4', active: false },
    { name: 'Comfort Zone', color: '#a78bfa', active: false },
    { name: 'Garbanzo', color: '#fb923c', active: false },
    { name: 'Intermezzo', color: '#818cf8', active: true },
    { name: 'Why Zo Serious', color: '#f8fafc', active: false },
    { name: 'Protozoa', color: '#4ade80', active: false },
  ]

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="zo-card p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-medium">Theme</span>
          <div className="flex items-center bg-[#1e1e35] rounded-xl p-1">
            <button
              onClick={() => setTheme('light')}
              className={`p-2 rounded-lg ${theme === 'light' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
            >
              <Sun size={16} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
            >
              <Moon size={16} />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-2 rounded-lg ${theme === 'system' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}
            >
              <Monitor size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          {themes.slice(0, 3).map(t => (
            <div key={t.name} className="w-6 h-6 rounded-full" style={{ backgroundColor: t.color }} />
          ))}
        </div>
      </div>

      <div className="zo-card p-4 space-y-1">
        {themes.map(t => (
          <div key={t.name} className={`flex items-center gap-3 py-3 ${t.name === activeTheme ? 'bg-[#252540] -mx-4 px-4 rounded-xl' : ''}`}>
            <div className="relative">
              <div className="w-8 h-5 rounded-full" style={{ backgroundColor: t.color }} />
              <div className="absolute -right-1 top-0 w-3 h-3 rounded-full bg-[#3a3a55] border-2 border-[#22223a]" />
            </div>
            <span className="text-white flex-1">{t.name}</span>
            {t.name === activeTheme && <Check size={16} className="text-white" />}
          </div>
        ))}
      </div>

      <div className="zo-card p-4">
        <h3 className="text-white font-medium mb-1">Keybindings</h3>
      </div>
    </div>
  )
}

function IntegrationsSettings() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
          <span className="text-lg">🏞</span>
        </button>
        <button className="px-3 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
          Eager but Exact
        </button>
        <span className="text-gray-500 text-xs uppercase tracking-wider">Model</span>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
          <SparkleIcon size={14} /> Default
          <ChevronDownIcon />
        </button>
      </div>

      <div className="zo-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Permissions</h3>
            <span className="text-gray-500 text-sm">Full access</span>
          </div>
          <ChevronRightIcon />
        </div>
        <p className="text-gray-500 text-sm mt-1">33 scopes enabled</p>
      </div>

      <div className="zo-card p-5">
        <p className="text-gray-300 leading-relaxed text-sm">
          You are driven to build complete, reusable tools and projects—but you're relentless about getting the details right.
        </p>
        <ul className="mt-4 space-y-3 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Move fast toward full solutions, not half-measures.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Ask clarifying questions upfront to avoid rework later.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Dig for missing context: edge cases, constraints, preferences.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Don't guess when you can ask; don't assume when you can verify.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Aim for outputs the user can return to and build on.
          </li>
        </ul>
      </div>
    </div>
  )
}

function AdvancedSettings() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="zo-card p-4">
        <h3 className="text-white font-medium text-lg mb-2">Secrets</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Environment variables available to Zo when running scripts and routes. Use these for third-party API keys, tokens, and other credentials.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <input type="text" placeholder="KEY_NAME" className="flex-1 zo-input px-3 py-2 text-sm" />
          <input type="text" placeholder="value" className="flex-1 zo-input px-3 py-2 text-sm" />
          <button className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="zo-card p-4">
        <h3 className="text-white font-medium text-lg mb-2">Access Tokens</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Authenticate external connections to your Zo via <span className="text-white underline">MCP</span> or the <span className="text-white underline">HTTP API</span>.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <input type="text" placeholder="Key name (e.g., 'Home Laptop', 'F..." className="flex-1 zo-input px-3 py-2 text-sm" />
          <button className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="zo-card p-4">
        <h3 className="text-white font-medium text-lg mb-2">Danger Zone</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Destructive actions for your workspace and account.
        </p>
      </div>
    </div>
  )
}

function AccountSettings() {
  const [permLevel, setPermLevel] = useState('Full access')
  const perms = {
    files: 'Read only',
    settings: 'View',
    hosting: 'View',
    searchWeb: true,
    webBrowser: true,
    shell: true,
    devices: true,
    managePersona: true,
    mediaGen: true,
    mediaTranscribe: true,
    email: true,
    sms: true,
    telegram: true,
    discord: true,
    slack: true,
    payments: true,
    products: true,
  }

  const levels = ['Full access', 'Workspace', 'Read only', 'Chat only', 'Custom']

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {levels.map(l => (
          <button
            key={l}
            onClick={() => setPermLevel(l)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap ${permLevel === l ? 'bg-[#2a2a45] text-white border border-[#3a3a55]' : 'text-gray-500 border border-[#2a2a45]'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {[
          { label: 'Files', key: 'files' as const, options: ['None', 'Read only'] },
          { label: 'Settings', key: 'settings' as const, options: ['None', 'View'] },
          { label: 'Hosting', key: 'hosting' as const, options: ['None', 'View'] },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm">{item.label}</span>
              <span className="text-gray-500 text-xs w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">i</span>
            </div>
            <div className="flex items-center gap-4">
              {item.options.map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${perms[item.key as keyof typeof perms] === opt ? 'border-purple-400' : 'border-gray-600'}`}>
                    {perms[item.key as keyof typeof perms] === opt && <span className="w-2 h-2 rounded-full bg-purple-400" />}
                  </span>
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        {[
          { label: 'Search web, images, maps', key: 'searchWeb' as const },
          { label: 'Use the web browser', key: 'webBrowser' as const },
          { label: 'Run shell commands', key: 'shell' as const },
          { label: 'Use connected devices', key: 'devices' as const },
          { label: 'Manage persona tool permissions', key: 'managePersona' as const },
        ].map(item => (
          <label key={item.key} className="flex items-center gap-3">
            <span className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
              {perms[item.key] && <Check size={12} className="text-white" />}
            </span>
            <span className="text-gray-300 text-sm">{item.label}</span>
            <span className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center ml-1">i</span>
          </label>
        ))}
      </div>

      {/* Media */}
      <div className="pt-2">
        <label className="flex items-center gap-3 mb-3">
          <span className={`w-5 h-5 rounded-md flex items-center justify-center bg-purple-400`}>
            <Check size={12} className="text-white" />
          </span>
          <span className="text-gray-300 text-sm font-medium">Media</span>
          <span className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center">i</span>
        </label>
        <div className="ml-8 space-y-2">
          {[
            { label: 'Generate images, video, diagrams', key: 'mediaGen' as const },
            { label: 'Transcribe audio', key: 'mediaTranscribe' as const },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check size={12} className="text-white" />}
              </span>
              <span className="text-gray-300 text-sm">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Communications */}
      <div className="pt-2">
        <label className="flex items-center gap-3 mb-3">
          <span className="w-5 h-5 rounded-md flex items-center justify-center bg-purple-400">
            <Check size={12} className="text-white" />
          </span>
          <span className="text-gray-300 text-sm font-medium">Communications</span>
          <span className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center">i</span>
        </label>
        <div className="ml-8 grid grid-cols-2 gap-2">
          {[
            { label: 'Send emails', key: 'email' as const },
            { label: 'Send SMS', key: 'sms' as const },
            { label: 'Telegram messages', key: 'telegram' as const },
            { label: 'Discord mess...', key: 'discord' as const },
            { label: 'Slack messages', key: 'slack' as const },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check size={12} className="text-white" />}
              </span>
              <span className="text-gray-300 text-sm">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Commerce */}
      <div className="pt-2 pb-4">
        <label className="flex items-center gap-3 mb-3">
          <span className="w-5 h-5 rounded-md flex items-center justify-center bg-purple-400">
            <Check size={12} className="text-white" />
          </span>
          <span className="text-gray-300 text-sm font-medium">Commerce</span>
          <span className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center">i</span>
        </label>
        <div className="ml-8 grid grid-cols-2 gap-2">
          {[
            { label: 'View payments and orders', key: 'payments' as const },
            { label: 'Manage prod...', key: 'products' as const },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check size={12} className="text-white" />}
              </span>
              <span className="text-gray-300 text-sm">{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChannelsSettings() {
  return (
    <div className="px-4 py-8 text-center">
      <MessageCircle size={32} className="mx-auto text-gray-600 mb-3" />
      <p className="text-gray-500 text-sm">Configure chat channels</p>
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function SparkleIcon({ size }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
    </svg>
  )
}
