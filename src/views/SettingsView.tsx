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
    <div className="stack-3">
      {/* Header */}
      <div className="row-spread-2">
        <div className="row-6">
          <button className="row-21">
            <ChevronLeft size={14} /> Back
          </button>
        </div>
        <button className="card-small-6">
          Save
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="row-scroll-3">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`stack-small ${
              activeSubTab === tab.id ?
              'bg-[#2a2a45] text-white' :
              'text-gray-500'}`
              }>
              
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>);

        })}
      </div>

      {/* Content */}
      <div className="scroll">
        {activeSubTab === 'ux' && <UXSettings />}
        {activeSubTab === 'integrations' && <IntegrationsSettings />}
        {activeSubTab === 'advanced' && <AdvancedSettings />}
        {activeSubTab === 'account' && <AccountSettings />}
        {activeSubTab === 'channels' && <ChannelsSettings />}
      </div>
    </div>);

}

function UXSettings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [activeTheme] = useState('Intermezzo');

  const themes = [
  { name: 'RootbriizOSne', color: '#5eead4', active: false },
  { name: 'ComfortbriizOSne', color: '#a78bfa', active: false },
  { name: 'Garbanzo', color: '#fb923c', active: false },
  { name: 'Intermezzo', color: '#818cf8', active: true },
  { name: 'WhybriizOSSerious', color: '#f8fafc', active: false },
  { name: 'Protozoa', color: '#4ade80', active: false }];


  return (
    <div className="div-spacing-8">
      <div className="zo-card div-spacing-9">
        <div className="row-spread-6">
          <span className="h2-tone">Theme</span>
          <div className="card-row-2">
            <button
              onClick={() => setTheme('light')}
              className={`button-spacing ${theme === 'light' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
              
              <Sun size={16} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`button-spacing ${theme === 'dark' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
              
              <Moon size={16} />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`button-spacing ${theme === 'system' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
              
              <Monitor size={16} />
            </button>
          </div>
        </div>
        <div className="row-22">
          {themes.slice(0, 3).map((t) =>
          <div key={t.name} className="div-edge" style={{ backgroundColor: t.color }} />
          )}
        </div>
      </div>

      <div className="zo-card div-spacing-10">
        {themes.map((t) =>
        <div key={t.name} className={`row-23 ${t.name === activeTheme ? 'bg-[#252540] -mx-4 px-4 rounded-xl' : ''}`}>
            <div className="div-styled">
              <div className="div-edge-2" style={{ backgroundColor: t.color }} />
              <div className="card-floating-2" />
            </div>
            <span className="span-tone-5">{t.name}</span>
            {t.name === activeTheme && <Check size={16} className="check-tone" />}
          </div>
        )}
      </div>

      <div className="zo-card div-spacing-9">
        <h3 className="h3-spacing">Keybindings</h3>
      </div>
    </div>);

}

function IntegrationsSettings() {
  return (
    <div className="div-spacing-8">
      <div className="row-19">
        <button className="card-row-center-3">
          <span className="span-size">🏞</span>
        </button>
        <button className="card-small-7">
          Eager but Exact
        </button>
        <span className="caps-small">Model</span>
        <button className="card-row-small-10">
          <SparkleIcon size={14} /> Default
          <ChevronDownIcon />
        </button>
      </div>

      <div className="zo-card div-spacing-9">
        <div className="row-spread">
          <div>
            <h3 className="h2-tone">Permissions</h3>
            <span className="small-7">Full access</span>
          </div>
          <ChevronRightIcon />
        </div>
        <p className="small-32">33 scopes enabled</p>
      </div>

      <div className="zo-card div-spacing-11">
        <p className="small-33">
          You are driven to build complete, reusable tools and projects—but you're relentless about getting the details right.
        </p>
        <ul className="small-34">
          <li className="row-24">
            <span className="card-11" />
            Move fast toward full solutions, not half-measures.
          </li>
          <li className="row-24">
            <span className="card-11" />
            Ask clarifying questions upfront to avoid rework later.
          </li>
          <li className="row-24">
            <span className="card-11" />
            Dig for missing context: edge cases, constraints, preferences.
          </li>
          <li className="row-24">
            <span className="card-11" />
            Don't guess when you can ask; don't assume when you can verify.
          </li>
          <li className="row-24">
            <span className="card-11" />
            Aim for outputs the user can return to and build on.
          </li>
        </ul>
      </div>
    </div>);

}

function AdvancedSettings() {
  return (
    <div className="div-spacing-8">
      <div className="zo-card div-spacing-9">
        <h3 className="h3-spacing-2">Secrets</h3>
        <p className="small-35">
          Environment variables available tobriizOSwhen running scripts and routes. Use these for third-party API keys, tokens, and other credentials.
        </p>
        <div className="row-25">
          <input type="text" placeholder="KEY_NAME" className="zo-input small-36" />
          <input type="text" placeholder="value" className="zo-input small-36" />
          <button className="card-row-small-11">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="zo-card div-spacing-9">
        <h3 className="h3-spacing-2">Access Tokens</h3>
        <p className="small-35">
          Authenticate external connections to yourbriizOSvia <span className="span-tone-6">MCP</span> or the <span className="span-tone-6">HTTP API</span>.
        </p>
        <div className="row-25">
          <input type="text" placeholder="Key name (e.g., 'Home Laptop', 'F..." className="zo-input small-36" />
          <button className="card-row-small-11">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="zo-card div-spacing-9">
        <h3 className="h3-spacing-2">DangerbriizOSne</h3>
        <p className="small-35">
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
    <div className="div-spacing-8">
      <div className="row-scroll-4">
        {levels.map((l) =>
        <button
          key={l}
          onClick={() => setPermLevel(l)}
          className={`small-37 ${permLevel === l ? 'bg-[#2a2a45] text-white border border-[#3a3a55]' : 'text-gray-500 border border-[#2a2a45]'}`}>
          
            {l}
          </button>
        )}
      </div>

      <div className="div-styled-3">
        {[
        { label: 'Files', key: 'files' as const, options: ['None', 'Read only'] },
        { label: 'Settings', key: 'settings' as const, options: ['None', 'View'] },
        { label: 'Hosting', key: 'hosting' as const, options: ['None', 'View'] }].
        map((item) =>
        <div key={item.key} className="row-spread">
            <div className="row-6">
              <span className="small-20">{item.label}</span>
              <span className="row-center-small-3">i</span>
            </div>
            <div className="row-26">
              {item.options.map((opt) =>
            <label key={opt} className="row-small-8">
                  <span className={`row-center ${perms[item.key as keyof typeof perms] === opt ? 'border-purple-400' : 'border-gray-600'}`}>
                    {perms[item.key as keyof typeof perms] === opt && <span className="card-12" />}
                  </span>
                  {opt}
                </label>
            )}
            </div>
          </div>
        )}
      </div>

      <div className="div-spacing-12">
        {[
        { label: 'Search web, images, maps', key: 'searchWeb' as const },
        { label: 'Use the web browser', key: 'webBrowser' as const },
        { label: 'Run shell commands', key: 'shell' as const },
        { label: 'Use connected devices', key: 'devices' as const },
        { label: 'Manage persona tool permissions', key: 'managePersona' as const }].
        map((item) =>
        <label key={item.key} className="row-2">
            <span className={`row-center-2 ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
              {perms[item.key] && <Check size={12} className="check-tone" />}
            </span>
            <span className="small-33">{item.label}</span>
            <span className="row-center-small-4">i</span>
          </label>
        )}
      </div>

      {/* Media */}
      <div className="div-spacing-13">
        <label className="row-27">
          <span className={`card-row-center-10`}>
            <Check size={12} className="check-tone" />
          </span>
          <span className="small-38">Media</span>
          <span className="row-center-small-5">i</span>
        </label>
        <div className="div-spacing-14">
          {[
          { label: 'Generate images, video, diagrams', key: 'mediaGen' as const },
          { label: 'Transcribe audio', key: 'mediaTranscribe' as const }].
          map((item) =>
          <label key={item.key} className="row-2">
              <span className={`row-center-2 ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check size={12} className="check-tone" />}
              </span>
              <span className="small-33">{item.label}</span>
            </label>
          )}
        </div>
      </div>

      {/* Communications */}
      <div className="div-spacing-13">
        <label className="row-27">
          <span className="card-row-center-10">
            <Check size={12} className="check-tone" />
          </span>
          <span className="small-38">Communications</span>
          <span className="row-center-small-5">i</span>
        </label>
        <div className="two-col-grid-2">
          {[
          { label: 'Send emails', key: 'email' as const },
          { label: 'Send SMS', key: 'sms' as const },
          { label: 'Telegram messages', key: 'telegram' as const },
          { label: 'Discord mess...', key: 'discord' as const },
          { label: 'Slack messages', key: 'slack' as const }].
          map((item) =>
          <label key={item.key} className="row-2">
              <span className={`row-center-2 ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check size={12} className="check-tone" />}
              </span>
              <span className="small-33">{item.label}</span>
            </label>
          )}
        </div>
      </div>

      {/* Commerce */}
      <div className="div-spacing-15">
        <label className="row-27">
          <span className="card-row-center-10">
            <Check size={12} className="check-tone" />
          </span>
          <span className="small-38">Commerce</span>
          <span className="row-center-small-5">i</span>
        </label>
        <div className="two-col-grid-2">
          {[
          { label: 'View payments and orders', key: 'payments' as const },
          { label: 'Manage prod...', key: 'products' as const }].
          map((item) =>
          <label key={item.key} className="row-2">
              <span className={`row-center-2 ${perms[item.key] ? 'bg-purple-400' : 'border-2 border-gray-600'}`}>
                {perms[item.key] && <Check size={12} className="check-tone" />}
              </span>
              <span className="small-33">{item.label}</span>
            </label>
          )}
        </div>
      </div>
    </div>);

}

function ChannelsSettings() {
  return (
    <div className="div-spacing-16">
      <MessageCircle size={32} className="messagecircle-spacing" />
      <p className="small-7">Configure chat channels</p>
    </div>);

}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="6 9 12 15 18 9" />
    </svg>);

}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>);

}

function SparkleIcon({ size }: {size?: number;}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
    </svg>);

}