export type ChatProvider = 'chatgpt' | 'gemini' | 'claude'

export interface ChatParams {
  top_p: number
  temperature: number
  max_tokens: number
}

export interface ChatProviderSettings {
  model: string
  prompt: string
  params: ChatParams
  customModels: string[]
}

export interface ChatSettingsState {
  provider: ChatProvider
  providers: Record<ChatProvider, ChatProviderSettings>
  enableTools: boolean
}

export const CHAT_SETTINGS_STORAGE_KEY = 'briizos.chatSettings.v1'

export const DEFAULT_MODELS: Record<ChatProvider, string[]> = {
  chatgpt: ['gpt-4.1', 'gpt-4o', 'gpt-4o-mini', 'o3-mini-high', 'o3-mini', 'gpt-3.5-turbo'],
  gemini: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  claude: [
    'claude-sonnet-4-5-20250929',
    'claude-opus-4-1-20250805',
    'claude-opus-4-20250514',
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-haiku-20240307',
    'claude-3-opus-20240229',
  ],
}

const API_KEY_STORAGE_KEYS: Record<ChatProvider, string> = {
  chatgpt: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
}

const PROVIDERS: ChatProvider[] = ['chatgpt', 'gemini', 'claude']

function defaultProviderState(provider: ChatProvider): ChatProviderSettings {
  return {
    model: DEFAULT_MODELS[provider][0],
    prompt: '',
    params: {
      top_p: 1,
      temperature: 1,
      max_tokens: 1024,
    },
    customModels: [],
  }
}

export function createDefaultChatSettings(): ChatSettingsState {
  return {
    provider: 'gemini',
    providers: {
      chatgpt: defaultProviderState('chatgpt'),
      gemini: defaultProviderState('gemini'),
      claude: defaultProviderState('claude'),
    },
    enableTools: true,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isChatProvider(value: unknown): value is ChatProvider {
  return value === 'chatgpt' || value === 'gemini' || value === 'claude'
}

function numberValue(value: unknown, fallback: number): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function normalizeProviderSettings(provider: ChatProvider, raw: unknown): ChatProviderSettings {
  const base = defaultProviderState(provider)
  if (!isRecord(raw)) return base
  const params = isRecord(raw.params) ? raw.params : {}

  return {
    model: typeof raw.model === 'string' && raw.model.trim() ? raw.model : base.model,
    prompt: typeof raw.prompt === 'string' ? raw.prompt : '',
    params: {
      top_p: numberValue(params.top_p, base.params.top_p),
      temperature: numberValue(params.temperature, base.params.temperature),
      max_tokens: numberValue(params.max_tokens, base.params.max_tokens),
    },
    customModels: Array.isArray(raw.customModels) ? raw.customModels.map(String).filter(Boolean) : [],
  }
}

export function loadChatSettings(): ChatSettingsState {
  if (typeof window === 'undefined') return createDefaultChatSettings()

  try {
    const raw = window.localStorage.getItem(CHAT_SETTINGS_STORAGE_KEY)
    if (!raw) return createDefaultChatSettings()

    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) return createDefaultChatSettings()
    const parsedProviders = isRecord(parsed.providers) ? parsed.providers : {}

    return {
      provider: isChatProvider(parsed.provider) ? parsed.provider : 'gemini',
      providers: {
        chatgpt: normalizeProviderSettings('chatgpt', parsedProviders.chatgpt),
        gemini: normalizeProviderSettings('gemini', parsedProviders.gemini),
        claude: normalizeProviderSettings('claude', parsedProviders.claude),
      },
      enableTools: parsed.enableTools !== false,
    }
  } catch {
    return createDefaultChatSettings()
  }
}

export function saveChatSettings(settings: ChatSettingsState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAT_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent('briizos-settings-update', { detail: getCurrentProviderSettings(settings) }))
}

export function getCurrentProviderSettings(settings: ChatSettingsState) {
  return {
    provider: settings.provider,
    ...settings.providers[settings.provider],
    enableTools: settings.enableTools,
  }
}

export function getAllModels(settings: ChatSettingsState, provider: ChatProvider) {
  const customModels = settings.providers[provider].customModels
  return [...DEFAULT_MODELS[provider], ...customModels]
}

export function apiKeyStorageKey(provider: ChatProvider) {
  return API_KEY_STORAGE_KEYS[provider]
}

export function loadApiKey(provider: ChatProvider): string {
  if (typeof window === 'undefined') return ''

  const keyName = apiKeyStorageKey(provider)
  const globalValue = (window as unknown as Record<string, string | undefined>)[keyName]
  const storedValue = window.localStorage.getItem(keyName)
  const key = globalValue || storedValue || ''

  if (globalValue && !storedValue) {
    window.localStorage.setItem(keyName, globalValue)
  }

  return key
}

export function saveApiKey(provider: ChatProvider, value: string) {
  if (typeof window === 'undefined') return
  const keyName = apiKeyStorageKey(provider)
  const trimmed = value.trim()

  if (trimmed) {
    window.localStorage.setItem(keyName, trimmed)
  } else {
    window.localStorage.removeItem(keyName)
  }
}

export function loadAllApiKeys(): Record<ChatProvider, string> {
  return PROVIDERS.reduce((keys, provider) => {
    keys[provider] = loadApiKey(provider)
    return keys
  }, {} as Record<ChatProvider, string>)
}

export function providerLabel(provider: ChatProvider) {
  if (provider === 'chatgpt') return 'OpenAI'
  if (provider === 'gemini') return 'Gemini'
  return 'Claude'
}
