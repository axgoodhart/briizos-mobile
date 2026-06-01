import { type FormEvent, useMemo, useState } from 'react'
import {
  Bot,
  Check,
  CheckCircle2,
  Eye,
  KeyRound,
  Loader2,
  MessageCircle,
  Plus,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import {
  getAllModels,
  loadAllApiKeys,
  loadChatSettings,
  providerLabel,
  saveApiKey,
  saveChatSettings,
  type ChatProvider,
  type ChatProviderSettings,
  type ChatParams,
  type ChatSettingsState,
} from '../services/chatSettings'
import { sendChatMessage, type ChatApiMessage } from '../services/chatApi'
import {
  executeMobileTool,
  formatToolCall,
  getMobileToolDefinitions,
  isWriteTool,
  type MobileToolCall,
} from '../services/mobileToolRegistry'
import type { BriizOSMobileState } from '../types/briizos'

interface ChatsViewProps {
  sync: BriizOSMobileState
}

type ChatTab = 'chat' | 'tools' | 'settings'
type UiMessageRole = 'user' | 'assistant' | 'tool'

interface UiMessage {
  id: string
  role: UiMessageRole
  content: string
  error?: boolean
  meta?: string
}

const PROVIDERS: ChatProvider[] = ['gemini', 'chatgpt', 'claude']

function makeMessage(role: UiMessageRole, content: string, options: Partial<UiMessage> = {}): UiMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    ...options,
  }
}

function isChatTranscriptMessage(message: UiMessage): message is UiMessage & { role: 'user' | 'assistant' } {
  return message.role === 'user' || message.role === 'assistant'
}

function toChatHistory(messages: UiMessage[]): ChatApiMessage[] {
  return messages
    .filter(isChatTranscriptMessage)
    .map(message => ({
      role: message.role,
      content: message.content,
    }))
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function summarizeToolResult(result: unknown) {
  if (typeof result === 'string') return result
  if (result && typeof result === 'object' && 'message' in result) {
    return String((result as { message: unknown }).message)
  }
  return JSON.stringify(result, null, 2)
}

export default function ChatsView({ sync }: ChatsViewProps) {
  const [activeTab, setActiveTab] = useState<ChatTab>('chat')
  const [settings, setSettings] = useState<ChatSettingsState>(() => loadChatSettings())
  const [apiKeys, setApiKeys] = useState<Record<ChatProvider, string>>(() => loadAllApiKeys())
  const [customModel, setCustomModel] = useState('')
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [busyToolId, setBusyToolId] = useState<string | null>(null)
  const [pendingTools, setPendingTools] = useState<MobileToolCall[]>([])
  const [messages, setMessages] = useState<UiMessage[]>([
    makeMessage('assistant', 'Chat is ready. Add a provider key in Settings, then ask Zo to read your schedule, search notes, or queue changes for confirmation.', {
      meta: 'Zo',
    }),
  ])

  const currentProviderSettings = settings.providers[settings.provider]
  const availableModels = useMemo(() => getAllModels(settings, settings.provider), [settings])
  const toolDefinitions = useMemo(() => getMobileToolDefinitions(), [])

  function persistSettings(next: ChatSettingsState) {
    setSettings(next)
    saveChatSettings(next)
  }

  function updateProvider(provider: ChatProvider) {
    persistSettings({ ...settings, provider })
  }

  function updateCurrentProvider(patch: Partial<ChatProviderSettings>) {
    persistSettings({
      ...settings,
      providers: {
        ...settings.providers,
        [settings.provider]: {
          ...currentProviderSettings,
          ...patch,
        },
      },
    })
  }

  function updateCurrentParams(patch: Partial<ChatParams>) {
    updateCurrentProvider({
      params: {
        ...currentProviderSettings.params,
        ...patch,
      },
    })
  }

  function updateApiKey(provider: ChatProvider, value: string) {
    setApiKeys(prev => ({ ...prev, [provider]: value }))
  }

  function persistApiKey() {
    setSavingKey(true)
    saveApiKey(settings.provider, apiKeys[settings.provider])
    window.setTimeout(() => setSavingKey(false), 350)
  }

  function addCustomModel() {
    const model = customModel.trim()
    if (!model) return
    const existing = getAllModels(settings, settings.provider)
    const customModels = existing.includes(model)
      ? currentProviderSettings.customModels
      : [...currentProviderSettings.customModels, model]

    updateCurrentProvider({ model, customModels })
    setCustomModel('')
  }

  function appendMessage(message: UiMessage) {
    setMessages(prev => [...prev, message])
  }

  async function runToolCall(call: MobileToolCall, confirmed = false) {
    const result = await executeMobileTool(call, sync, { confirmed })
    appendMessage(makeMessage('tool', summarizeToolResult(result), {
      meta: call.tool,
      error: !result.success,
    }))
  }

  async function handleToolCall(call: MobileToolCall) {
    if (isWriteTool(call.tool)) {
      setPendingTools(prev => [...prev, call])
      appendMessage(makeMessage('tool', `Queued for confirmation: ${formatToolCall(call)}`, {
        meta: 'confirmation required',
      }))
      return
    }

    try {
      await runToolCall(call)
    } catch (error) {
      appendMessage(makeMessage('tool', errorMessage(error), { error: true, meta: call.tool }))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    const userMessage = makeMessage('user', trimmed, { meta: 'Alex' })
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsSending(true)

    try {
      const result = await sendChatMessage(toChatHistory(nextMessages), settings, sync)
      appendMessage(makeMessage('assistant', result.content || 'I prepared the requested tool action.', {
        meta: `${providerLabel(result.provider)} / ${result.model}`,
      }))

      for (const call of result.toolCalls) {
        await handleToolCall(call)
      }
    } catch (error) {
      appendMessage(makeMessage('assistant', errorMessage(error), { error: true, meta: 'chat error' }))
    } finally {
      setIsSending(false)
    }
  }

  async function confirmTool(call: MobileToolCall) {
    setBusyToolId(call.id)
    try {
      await runToolCall(call, true)
      setPendingTools(prev => prev.filter(item => item.id !== call.id))
    } catch (error) {
      appendMessage(makeMessage('tool', errorMessage(error), { error: true, meta: call.tool }))
    } finally {
      setBusyToolId(null)
    }
  }

  function cancelTool(call: MobileToolCall) {
    setPendingTools(prev => prev.filter(item => item.id !== call.id))
    appendMessage(makeMessage('tool', `Cancelled: ${formatToolCall(call)}`, { meta: 'cancelled' }))
  }

  const tabs: { id: ChatTab; label: string; icon: LucideIcon }[] = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ]

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#252540]">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all ${
                activeTab === tab.id ? 'bg-[#252540] text-white' : 'text-gray-500'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'chat' && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[88%] rounded-2xl border px-3 py-2 ${
                  message.role === 'user'
                    ? 'border-cyan-400/20 bg-cyan-400/10 text-white'
                    : message.error
                      ? 'border-red-500/30 bg-red-500/10 text-red-100'
                      : message.role === 'tool'
                        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-50'
                        : 'border-[#2a2a45] bg-[#1e1e35] text-gray-100'
                }`}>
                  {message.meta && <p className="mb-1 text-[10px] uppercase tracking-wide text-gray-500">{message.meta}</p>}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={15} className="animate-spin" />
                Waiting for {providerLabel(settings.provider)}
              </div>
            )}
          </div>

          {pendingTools.length > 0 && (
            <div className="border-t border-[#252540] px-4 py-3 space-y-2">
              {pendingTools.map(call => (
                <div key={call.id} className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm text-amber-100">
                    <ShieldCheck size={15} />
                    <span className="flex-1">{formatToolCall(call)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void confirmTool(call)}
                      disabled={busyToolId === call.id || !sync.uid}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100 disabled:opacity-45"
                    >
                      {busyToolId === call.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Confirm
                    </button>
                    <button
                      onClick={() => cancelTool(call)}
                      disabled={busyToolId === call.id}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-100 disabled:opacity-45"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                  {!sync.uid && <p className="mt-2 text-xs text-amber-200/70">Sign in from Menu before confirming writes.</p>}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-[#252540] px-4 py-3">
            <div className="rounded-2xl border border-[#2a2a45] bg-[#1e1e35] p-3">
              <textarea
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="Ask Zo..."
                className="min-h-[64px] w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
              />
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-[#2a2a45] px-2.5 py-1 text-xs text-gray-300">
                  <Bot size={13} />
                  {providerLabel(settings.provider)}
                </div>
                <div className="min-w-0 flex-1 truncate text-xs text-gray-500">{currentProviderSettings.model}</div>
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3a3a55] text-white disabled:opacity-40"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <div className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3">
            <div className="mb-1 flex items-center gap-2 text-white">
              <Wrench size={16} />
              <span className="font-medium">Mobile Tool Registry</span>
            </div>
            <p className="text-sm text-gray-500">Read tools run immediately. Write tools wait for your confirmation in Chat.</p>
          </div>
          {toolDefinitions.map(tool => (
            <div key={tool.name} className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3">
              <div className="mb-1 flex items-center gap-2">
                {tool.requiresConfirmation
                  ? <ShieldCheck size={15} className="text-amber-200" />
                  : <Eye size={15} className="text-emerald-200" />}
                <p className="font-mono text-sm text-white">{tool.name}</p>
                <span className="ml-auto text-[10px] uppercase tracking-wide text-gray-500">
                  {tool.requiresConfirmation ? 'confirm' : 'read'}
                </span>
              </div>
              <p className="text-sm text-gray-400">{tool.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3">
            <p className="mb-3 text-sm font-medium text-white">Provider</p>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map(provider => (
                <button
                  key={provider}
                  onClick={() => updateProvider(provider)}
                  className={`rounded-xl border px-2 py-2 text-sm ${
                    settings.provider === provider
                      ? 'border-cyan-300/40 bg-cyan-300/10 text-white'
                      : 'border-[#2a2a45] text-gray-500'
                  }`}
                >
                  {providerLabel(provider)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs text-gray-500">Model</span>
              <select
                value={currentProviderSettings.model}
                onChange={event => updateCurrentProvider({ model: event.target.value })}
                className="zo-input w-full px-3 py-2.5 text-sm outline-none"
              >
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <input
                value={customModel}
                onChange={event => setCustomModel(event.target.value)}
                placeholder="custom model id"
                className="zo-input min-w-0 flex-1 px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={addCustomModel}
                className="flex items-center gap-1 rounded-xl bg-[#2a2a45] px-3 py-2 text-sm text-white"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <KeyRound size={15} />
              <span className="text-sm font-medium">{providerLabel(settings.provider)} Key</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKeys[settings.provider]}
                onChange={event => updateApiKey(settings.provider, event.target.value)}
                placeholder={`${settings.provider === 'chatgpt' ? 'OPENAI' : settings.provider === 'gemini' ? 'GEMINI' : 'ANTHROPIC'}_API_KEY`}
                className="zo-input min-w-0 flex-1 px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={persistApiKey}
                className="flex items-center gap-1 rounded-xl bg-[#2a2a45] px-3 py-2 text-sm text-white"
              >
                {savingKey ? <CheckCircle2 size={14} /> : <Save size={14} />}
                Save
              </button>
            </div>
            <p className="text-xs text-gray-500">Stored locally with the same key names as briizOS.Web.</p>
          </div>

          <div className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <SlidersHorizontal size={15} />
              <span className="text-sm font-medium">Parameters</span>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs text-gray-500">Temperature {currentProviderSettings.params.temperature.toFixed(2)}</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={currentProviderSettings.params.temperature}
                onChange={event => updateCurrentParams({ temperature: Number(event.target.value) })}
                className="w-full accent-cyan-300"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-gray-500">Top P {currentProviderSettings.params.top_p.toFixed(2)}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={currentProviderSettings.params.top_p}
                onChange={event => updateCurrentParams({ top_p: Number(event.target.value) })}
                className="w-full accent-cyan-300"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-gray-500">Max tokens</span>
              <input
                type="number"
                min="256"
                step="100"
                value={currentProviderSettings.params.max_tokens}
                onChange={event => updateCurrentParams({ max_tokens: Number(event.target.value) })}
                className="zo-input w-full px-3 py-2 text-sm outline-none"
              />
            </label>
          </div>

          <div className="rounded-xl border border-[#2a2a45] bg-[#1e1e35] p-3 space-y-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-white">Tools enabled</span>
              <button
                onClick={() => persistSettings({ ...settings, enableTools: !settings.enableTools })}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${
                  settings.enableTools ? 'bg-emerald-400/15 text-emerald-100' : 'bg-[#2a2a45] text-gray-400'
                }`}
              >
                {settings.enableTools ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                {settings.enableTools ? 'On' : 'Off'}
              </button>
            </label>
            <textarea
              value={currentProviderSettings.prompt}
              onChange={event => updateCurrentProvider({ prompt: event.target.value })}
              placeholder="Custom system prompt"
              className="zo-input min-h-[96px] w-full resize-none px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
