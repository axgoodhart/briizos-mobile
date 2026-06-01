import {
  getCurrentProviderSettings,
  loadApiKey,
  providerLabel,
  type ChatParams,
  type ChatProvider,
  type ChatSettingsState,
} from './chatSettings'
import { getMobileToolDefinitions, type MobileToolCall } from './mobileToolRegistry'
import type { BriizOSMobileState } from '../types/briizos'

export interface ChatApiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionResult {
  content: string
  toolCalls: MobileToolCall[]
  provider: ChatProvider
  model: string
}

function currentDateLabel() {
  return new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function summarizeSync(sync: BriizOSMobileState) {
  const incompleteTasks = sync.tasks.filter(task => !task.completed && task.status !== 'completed')
  const upcomingEvents = sync.events
    .filter(event => event.scheduledDate)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 8)
  const notes = sync.organizer.filter(item => item.type !== 'event').slice(0, 8)

  return `
# Current briizOS Mobile Context

Time: ${currentDateLabel()}
Sync: ${sync.status}${sync.email ? ` as ${sync.email}` : ''}

Organizer items: ${sync.organizer.length}
Tasks: ${sync.tasks.length} (${incompleteTasks.length} incomplete)
Events: ${sync.events.length}
Notes backing records: ${sync.windowStates.filter(item => item.type === 'note').length}

Upcoming events:
${upcomingEvents.length ? upcomingEvents.map(event => `- ${event.scheduledDate}: ${event.title}`).join('\n') : '- none'}

Open tasks:
${incompleteTasks.length ? incompleteTasks.slice(0, 8).map(task => `- ${task.title}${task.dueDate ? ` (due ${task.dueDate})` : ''}`).join('\n') : '- none'}

Recent organizer notes:
${notes.length ? notes.map(note => `- ${note.title}`).join('\n') : '- none'}
`.trim()
}

function toolPrompt() {
  const tools = getMobileToolDefinitions()
  const toolLines = tools.map(tool => {
    const params = Object.entries(tool.parameters)
      .map(([name, def]) => `${name}${def.optional ? '?' : ''}: ${def.type}`)
      .join(', ')
    return `- ${tool.name}(${params}) ${tool.requiresConfirmation ? '[requires user confirmation]' : '[read-only]'} - ${tool.description}`
  })

  return `
# Mobile Tool Registry

Use tools only when the user asks for data lookup or wants briizOS changed.
For a tool request, include one JSON block exactly like:

\`\`\`json
{"tool":"toolName","params":{"param":"value"}}
\`\`\`

Available tools:
${toolLines.join('\n')}

Write tools are queued in the mobile UI and only execute after Alex confirms them.
Do not say a write tool has already happened until a tool result confirms it.
Dates should be YYYY-MM-DD.
`.trim()
}

function buildSystemPrompt(settings: ChatSettingsState, sync: BriizOSMobileState) {
  const current = getCurrentProviderSettings(settings)
  const customPrompt = current.prompt.trim()
  const tools = settings.enableTools ? `\n\n${toolPrompt()}` : ''
  const custom = customPrompt ? `\n\n# Alex's Chat Instructions\n\n${customPrompt}` : ''

  return `You are Zo, the briizOS mobile assistant. Be concise, direct, and useful. Keep mobile responses short unless Alex asks for detail.${tools}${custom}\n\n${summarizeSync(sync)}`
}

function validToolNames() {
  return new Set(getMobileToolDefinitions().map(tool => tool.name))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function makeToolCall(tool: string, params: Record<string, unknown>): MobileToolCall {
  return {
    id: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tool,
    params,
  }
}

function parseToolObject(value: unknown): MobileToolCall | null {
  if (!isRecord(value) || typeof value.tool !== 'string' || !isRecord(value.params)) return null
  if (!validToolNames().has(value.tool)) return null
  return makeToolCall(value.tool, value.params)
}

function parseAssistantToolCalls(content: string) {
  const toolCalls: MobileToolCall[] = []
  const blockPattern = /```json\s*([\s\S]*?)\s*```/g
  const cleaned = content.replace(blockPattern, (_, rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson) as unknown
      const parsedCalls = Array.isArray(parsed)
        ? parsed.map(parseToolObject).filter((item): item is MobileToolCall => Boolean(item))
        : [parseToolObject(parsed)].filter((item): item is MobileToolCall => Boolean(item))

      if (!parsedCalls.length) return _
      toolCalls.push(...parsedCalls)
      return ''
    } catch {
      return _
    }
  }).trim()

  if (!toolCalls.length) {
    try {
      const parsed = JSON.parse(content) as unknown
      const call = parseToolObject(parsed)
      if (call) return { content: '', toolCalls: [call] }
    } catch {
      return { content: cleaned, toolCalls }
    }
  }

  return { content: cleaned, toolCalls }
}

function requireApiKey(provider: ChatProvider) {
  const key = loadApiKey(provider)
  if (!key) throw new Error(`${providerLabel(provider)} API key is missing. Add it in the Chat Settings tab.`)
  return key
}

async function responseError(response: Response) {
  const text = await response.text().catch(() => '')
  return text ? `${response.status} ${response.statusText}: ${text.slice(0, 400)}` : `${response.status} ${response.statusText}`
}

async function fetchGemini(messages: ChatApiMessage[], model: string, apiKey: string, params: ChatParams) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const contents = messages.map(message => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }))

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: params.temperature,
        topP: params.top_p,
        maxOutputTokens: params.max_tokens,
      },
    }),
  })

  if (!response.ok) throw new Error(await responseError(response))
  const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  return data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || ''
}

async function fetchOpenAI(messages: ChatApiMessage[], model: string, apiKey: string, params: ChatParams) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: params.temperature,
      top_p: params.top_p,
      max_tokens: params.max_tokens,
    }),
  })

  if (!response.ok) throw new Error(await responseError(response))
  const data = await response.json() as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content || ''
}

async function fetchClaude(messages: ChatApiMessage[], model: string, apiKey: string, params: ChatParams) {
  const systemMessage = messages.find(message => message.role === 'system')?.content
  const claudeMessages = messages
    .filter(message => message.role !== 'system')
    .map(message => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.content }))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      system: systemMessage,
      messages: claudeMessages,
      temperature: params.temperature,
      top_p: params.top_p,
      max_tokens: params.max_tokens,
    }),
  })

  if (!response.ok) throw new Error(await responseError(response))
  const data = await response.json() as { content?: { type?: string; text?: string }[] }
  return data.content?.filter(part => part.type === 'text').map(part => part.text || '').join('') || ''
}

export async function sendChatMessage(
  history: ChatApiMessage[],
  settings: ChatSettingsState,
  sync: BriizOSMobileState,
): Promise<ChatCompletionResult> {
  const current = getCurrentProviderSettings(settings)
  const provider = current.provider
  const model = current.model
  const apiKey = requireApiKey(provider)
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(settings, sync) },
    ...history.filter(message => message.role !== 'system'),
  ]

  let content = ''
  if (provider === 'gemini') content = await fetchGemini(messages, model, apiKey, current.params)
  if (provider === 'chatgpt') content = await fetchOpenAI(messages, model, apiKey, current.params)
  if (provider === 'claude') content = await fetchClaude(messages, model, apiKey, current.params)

  const parsed = settings.enableTools ? parseAssistantToolCalls(content) : { content, toolCalls: [] }

  return {
    content: parsed.content,
    toolCalls: parsed.toolCalls,
    provider,
    model,
  }
}
