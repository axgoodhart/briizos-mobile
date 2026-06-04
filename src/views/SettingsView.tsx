import { useState } from 'react';
import {
  ChevronLeft, Sun, Moon, Monitor, Check,
  MessageCircle, Puzzle, Paintbrush, Grid3X3, User,
  Plus } from
'lucide-react';

export default function SettingsView() {
  const [activeSubTab, setActiveSubTab] = useState<'channels' | 'integrations' | 'ux' | 'advanced' | 'account'>('ux');

  const subTabs = [
  { id: 'channels' as const, label: 'Channels', icon: MessageCircle },
  { id: 'integrations' as const, label: 'Integrations', icon: Puzzle },
  { id: 'ux' as const, label: 'UX', icon: Paintbrush },
  { id: 'advanced' as const, label: 'Advanced', icon: Grid3X3 },
  { id: 'account' as const, label: 'Account', icon: User }];


  return (
    <div style-id="stylo-380" className="h-full flex flex-col bg-[#000]">
      {/* Header */}
      <div style-id="stylo-381" className="flex items-center justify-between px-4 py-3 border-b border-[#252540]">
        <div style-id="stylo-382" className="flex items-center gap-2">
          <button style-id="stylo-383" className="flex items-center gap-1 text-gray-400 px-3 py-1.5 rounded-lg border border-[#2a2a45]">
            <ChevronLeft style-id="stylo-384" size={14} /> Back
          </button>
        </div>
        <button style-id="stylo-385" className="px-4 py-1.5 rounded-full bg-[#6b6b9e] text-white text-sm">
          Save
        </button>
      </div>

      {/* Sub-tabs */}
      <div style-id="stylo-386" className="flex items-center gap-1 px-2 py-2 overflow-x-auto border-b border-[#252540]">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button style-id="stylo-387"
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs min-w-[60px] transition-all ${
            activeSubTab === tab.id ?
            'bg-[#2a2a45] text-white' :
            'text-gray-500'}`
            }>
              
              <Icon style-id="stylo-388" size={16} />
              <span style-id="stylo-389">{tab.label}</span>
            </button>);

        })}
      </div>

      {/* Content */}
      <div style-id="stylo-390" className="flex-1 overflow-y-auto">
        {activeSubTab === 'ux' && <UXSettings style-id="stylo-391" />}
        {activeSubTab === 'integrations' && <IntegrationsSettings style-id="stylo-392" />}
        {activeSubTab === 'advanced' && <AdvancedSettings style-id="stylo-393" />}
        {activeSubTab === 'account' && <AccountSettings style-id="stylo-394" />}
        {activeSubTab === 'channels' && <ChannelsSettings style-id="stylo-395" />}
      </div>
    </div>);

}

function UXSettings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [activeTheme] = useState('Intermezzo');

  const themes = [
  { name: 'Root Zone', color: '#5eead4', active: false },
  { name: 'Comfort Zone', color: '#a78bfa', active: false },
  { name: 'Garbanzo', color: '#fb923c', active: false },
  { name: 'Intermezzo', color: '#818cf8', active: true },
  { name: 'Why Zo Serious', color: '#f8fafc', active: false },
  { name: 'Protozoa', color: '#4ade80', active: false }];


  return (
    <div style-id="stylo-396" className="px-4 py-4 space-y-4">
      <div style-id="stylo-397" className="zo-card p-4">
        <div style-id="stylo-398" className="flex items-center justify-between mb-4">
          <span style-id="stylo-399" className="text-white font-medium">Theme</span>
          <div style-id="stylo-400" className="flex items-center bg-[#1e1e35] rounded-xl p-1">
            <button style-id="stylo-401"
            onClick={() => setTheme('light')}
            className={`p-2 rounded-lg ${theme === 'light' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
              
              <Sun style-id="stylo-402" size={16} />
            </button>
            <button style-id="stylo-403"
            onClick={() => setTheme('dark')}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
              
              <Moon style-id="stylo-404" size={16} />
            </button>
            <button style-id="stylo-405"
            onClick={() => setTheme('system')}
            className={`p-2 rounded-lg ${theme === 'system' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
              
              <Monitor style-id="stylo-406" size={16} />
            </button>
          </div>
        </div>
        <div style-id="stylo-407" className="flex items-center gap-2 mb-4">
          {themes.slice(0, 3).map((t) =>
          <div style-id="stylo-408" key={t.name} className="w-6 h-6 rounded-full" style={{ backgroundColor: t.color }} />
          )}
        </div>
      </div>

      <div style-id="stylo-409" className="zo-card p-4 space-y-1">
        {themes.map((t) =>
        <div style-id="stylo-410" key={t.name} className={`flex items-center gap-3 py-3 ${t.name === activeTheme ? 'bg-[#252540] -mx-4 px-4 rounded-xl' : ''}`}>
            <div style-id="stylo-411" className="relative">
              <div style-id="stylo-412" className="w-8 h-5 rounded-full" style={{ backgroundColor: t.color }} />
              <div style-id="stylo-413" className="absolute -right-1 top-0 w-3 h-3 rounded-full bg-[#3a3a55] border-2 border-[#22223a]" />
            </div>
            <span style-id="stylo-414" className="text-white flex-1">{t.name}</span>
            {t.name === activeTheme && <Check style-id="stylo-415" size={16} className="text-white" />}
          </div>
        )}
      </div>

      <div style-id="stylo-416" className="zo-card p-4">
        <h3 style-id="stylo-417" className="text-white font-medium mb-1">Keybindings</h3>
      </div>
    </div>);

}

function IntegrationsSettings() {
  return (
    <div style-id="stylo-418" className="px-4 py-4 space-y-4">
      <div style-id="stylo-419" className="flex items-center gap-2 mb-2">
        <button style-id="stylo-420" className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
          <span style-id="stylo-421" className="text-lg">🏞</span>
        </button>
        <button style-id="stylo-422" className="px-3 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
          Eager but Exact
        </button>
        <span style-id="stylo-423" className="text-gray-500 text-xs uppercase tracking-wider">Model</span>
        <button style-id="stylo-424" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
          <SparkleIcon style-id="stylo-425" size={14} /> Default
          <ChevronDownIcon style-id="stylo-426" />
        </button>
      </div>

      <div style-id="stylo-427" className="zo-card p-4">
        <div style-id="stylo-428" className="flex items-center justify-between">
          <div style-id="stylo-429">
            <h3 style-id="stylo-430" className="text-white font-medium">Permissions</h3>
            <span style-id="stylo-431" className="text-gray-500 text-sm">Full access</span>
          </div>
          <ChevronRightIcon style-id="stylo-432" />
        </div>
        <p style-id="stylo-433" className="text-gray-500 text-sm mt-1">33 scopes enabled</p>
      </div>

      <div style-id="stylo-434" className="zo-card p-5">
        <p style-id="stylo-435" className="text-gray-300 leading-relaxed text-sm">
          You are driven to build complete, reusable tools and projects—but you're relentless about getting the details right.
        </p>
        <ul style-id="stylo-436" className="mt-4 space-y-3 text-gray-300 text-sm">
          <li style-id="stylo-437" className="flex items-start gap-2">
            <span style-id="stylo-438" className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Move fast toward full solutions, not half-measures.
          </li>
          <li style-id="stylo-439" className="flex items-start gap-2">
            <span style-id="stylo-440" className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Ask clarifying questions upfront to avoid rework later.
          </li>
          <li style-id="stylo-441" className="flex items-start gap-2">
            <span style-id="stylo-442" className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Dig for missing context: edge cases, constraints, preferences.
          </li>
          <li style-id="stylo-443" className="flex items-start gap-2">
            <span style-id="stylo-444" className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Don't guess when you can ask; don't assume when you can verify.
          </li>
          <li style-id="stylo-445" className="flex items-start gap-2">
            <span style-id="stylo-446" className="text-gray-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            Aim for outputs the user can return to and build on.
          </li>
        </ul>
      </div>
    </div>);

}

function AdvancedSettings() {
  return (
    <div style-id="stylo-447" className="px-4 py-4 space-y-4">
      <div style-id="stylo-448" className="zo-card p-4">
        <h3 style-id="stylo-449" className="text-white font-medium text-lg mb-2">Secrets</h3>
        <p style-id="stylo-450" className="text-gray-400 text-sm leading-relaxed">
          Environment variables available to Zo when running scripts and routes. Use these for third-party API keys, tokens, and other credentials.
        </p>
        <div style-id="stylo-451" className="flex items-center gap-2 mt-4">
          <input style-id="stylo-452" type="text" placeholder="KEY_NAME" className="flex-1 zo-input px-3 py-2 text-sm" />
          <input style-id="stylo-453" type="text" placeholder="value" className="flex-1 zo-input px-3 py-2 text-sm" />
          <button style-id="stylo-454" className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
            <Plus style-id="stylo-455" size={14} /> Add
          </button>
        </div>
      </div>

      <div style-id="stylo-456" className="zo-card p-4">
        <h3 style-id="stylo-457" className="text-white font-medium text-lg mb-2">Access Tokens</h3>
        <p style-id="stylo-458" className="text-gray-400 text-sm leading-relaxed">
          Authenticate external connections to your Zo via <span style-id="stylo-459" className="text-white underline">MCP</span> or the <span style-id="stylo-460" className="text-white underline">HTTP API</span>.
        </p>
        <div style-id="stylo-461" className="flex items-center gap-2 mt-4">
          <input style-id="stylo-462" type="text" placeholder="Key name (e.g., 'Home Laptop', 'F..." className="flex-1 zo-input px-3 py-2 text-sm" />
          <button style-id="stylo-463" className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2a2a45] text-white text-sm">
            <Plus style-id="stylo-464" size={14} /> Add
          </button>
        </div>
      </div>

      <div style-id="stylo-465" className="zo-card p-4">
        <h3 style-id="stylo-466" className="text-white font-medium text-lg mb-2">Danger Zone</h3>
        <p style-id="stylo-467" className="text-gray-400 text-sm leading-relaxed">
          Destructive actions for your workspace and account.
        </p>
      </div>
    </div>);

}

function AccountSettings() {
  const [permLevel, setPermLevel] = useState('Full access');
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
    products: true
  };

  const levels = ['Full access', 'Workspace', 'Read only', 'Chat only', 'Custom'];

  return (
    <div style-id="stylo-468" className="px-4 py-4 space-y-4">
      <div style-id="stylo-469" className="flex items-center gap-2 overflow-x-auto pb-2">
        {levels.map((l) =>
        <button style-id="stylo-470"
        key={l}
        onClick={() => setPermLevel(l)}
        className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap ${permLevel === l ? 'bg-[#2a2a45] text-white border border-[#3a3a55]' : 'text-gray-500 border border-[#2a2a45]'}`}>
          
            {l}
          </button>
        )}
      </div>

      <div style-id="stylo-471" className="space-y-4">
        {[
        { label: 'Files', key: 'files' as const, options: ['None', 'Read only'] },
        { label: 'Settings', key: 'settings' as const, options: ['None', 'View'] },
        { label: 'Hosting', key: 'hosting' as const, options: ['None', 'View'] }].
        map((item) =>
        <div style-id="stylo-472" key={item.key} className="flex items-center justify-between">
            <div style-id="stylo-473" className="flex items-center gap-2">
              <span style-id="stylo-474" className="text-white text-sm">{item.label}</span>
              <span style-id="stylo-475" className="text-gray-500 text-xs w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">i</span>
            </div>
            <div style-id="stylo-476" className="flex items-center gap-4">
              {item.options.map((opt) =>
            <label style-id="stylo-477" key={opt} className="flex items-center gap-2 text-sm text-gray-400">
                  <span style-id="stylo-478" className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${perms[item.key as keyof typeof perms] === opt ? 'border-purple-400' : 'border-gray-600'}`}>
                    {perms[item.key as keyof typeof perms] === opt && <span style-id="stylo-479" className="w-2 h-2 rounded-full bg-purple-400" />}
                  </span>
                  {opt}
                </label>
            )}
            </div>
          </div>
        )}
      </div>

      <div style-id="stylo-480" className="space-y-3 pt-2">
        {[
        { label: 'Search web, images, maps', key: 'searchWeb' as const },
        { label: 'Use the web browser', key: 'webBrowser' as const },
        { label: 'Run shell commands', key: 'shell' as const },
        { label: 'Use connected devices', key: 'devices' as const },
        { label: 'Manage persona tool permissions', key: 'managePersona' as const }].
        map((item) =>
        <label style-id="stylo-481" key={item.key} className="flex items-center gap-3">
            <span style-id="stylo-482" className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
              {perms[item.key] && <Check style-id="stylo-483" size={12} className="text-white" />}
            </span>
            <span style-id="stylo-484" className="text-gray-300 text-sm">{item.label}</span>
            <span style-id="stylo-485" className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center ml-1">i</span>
          </label>
        )}
      </div>

      {/* Media */}
      <div style-id="stylo-486" className="pt-2">
        <label style-id="stylo-487" className="flex items-center gap-3 mb-3">
          <span style-id="stylo-488" className={`w-5 h-5 rounded-md flex items-center justify-center bg-purple-400`}>
            <Check style-id="stylo-489" size={12} className="text-white" />
          </span>
          <span style-id="stylo-490" className="text-gray-300 text-sm font-medium">Media</span>
          <span style-id="stylo-491" className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center">i</span>
        </label>
        <div style-id="stylo-492" className="ml-8 space-y-2">
          {[
          { label: 'Generate images, video, diagrams', key: 'mediaGen' as const },
          { label: 'Transcribe audio', key: 'mediaTranscribe' as const }].
          map((item) =>
          <label style-id="stylo-493" key={item.key} className="flex items-center gap-3">
              <span style-id="stylo-494" className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check style-id="stylo-495" size={12} className="text-white" />}
              </span>
              <span style-id="stylo-496" className="text-gray-300 text-sm">{item.label}</span>
            </label>
          )}
        </div>
      </div>

      {/* Communications */}
      <div style-id="stylo-497" className="pt-2">
        <label style-id="stylo-498" className="flex items-center gap-3 mb-3">
          <span style-id="stylo-499" className="w-5 h-5 rounded-md flex items-center justify-center bg-purple-400">
            <Check style-id="stylo-500" size={12} className="text-white" />
          </span>
          <span style-id="stylo-501" className="text-gray-300 text-sm font-medium">Communications</span>
          <span style-id="stylo-502" className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center">i</span>
        </label>
        <div style-id="stylo-503" className="ml-8 grid grid-cols-2 gap-2">
          {[
          { label: 'Send emails', key: 'email' as const },
          { label: 'Send SMS', key: 'sms' as const },
          { label: 'Telegram messages', key: 'telegram' as const },
          { label: 'Discord mess...', key: 'discord' as const },
          { label: 'Slack messages', key: 'slack' as const }].
          map((item) =>
          <label style-id="stylo-504" key={item.key} className="flex items-center gap-3">
              <span style-id="stylo-505" className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check style-id="stylo-506" size={12} className="text-white" />}
              </span>
              <span style-id="stylo-507" className="text-gray-300 text-sm">{item.label}</span>
            </label>
          )}
        </div>
      </div>

      {/* Commerce */}
      <div style-id="stylo-508" className="pt-2 pb-4">
        <label style-id="stylo-509" className="flex items-center gap-3 mb-3">
          <span style-id="stylo-510" className="w-5 h-5 rounded-md flex items-center justify-center bg-purple-400">
            <Check style-id="stylo-511" size={12} className="text-white" />
          </span>
          <span style-id="stylo-512" className="text-gray-300 text-sm font-medium">Commerce</span>
          <span style-id="stylo-513" className="text-gray-600 text-xs w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center">i</span>
        </label>
        <div style-id="stylo-514" className="ml-8 grid grid-cols-2 gap-2">
          {[
          { label: 'View payments and orders', key: 'payments' as const },
          { label: 'Manage prod...', key: 'products' as const }].
          map((item) =>
          <label style-id="stylo-515" key={item.key} className="flex items-center gap-3">
              <span style-id="stylo-516" className={`w-5 h-5 rounded-md flex items-center justify-center ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check style-id="stylo-517" size={12} className="text-white" />}
              </span>
              <span style-id="stylo-518" className="text-gray-300 text-sm">{item.label}</span>
            </label>
          )}
        </div>
      </div>
    </div>);

}

function ChannelsSettings() {
  return (
    <div style-id="stylo-519" className="px-4 py-8 text-center">
      <MessageCircle style-id="stylo-520" size={32} className="mx-auto text-gray-600 mb-3" />
      <p style-id="stylo-521" className="text-gray-500 text-sm">Configure chat channels</p>
    </div>);

}

function ChevronDownIcon() {
  return (
    <svg style-id="stylo-522" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline style-id="stylo-523" points="6 9 12 15 18 9" />
    </svg>);

}

function ChevronRightIcon() {
  return (
    <svg style-id="stylo-524" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline style-id="stylo-525" points="9 18 15 12 9 6" />
    </svg>);

}

function SparkleIcon({ size }: {size?: number;}) {
  return (
    <svg style-id="stylo-526" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path style-id="stylo-527" d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
    </svg>);

}