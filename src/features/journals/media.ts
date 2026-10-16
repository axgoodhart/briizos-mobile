/* Camera photos and dictation. */

import { logActivity, saveImage } from './store'

const MAX_EDGE = 1600

/* Shrinks a photo to at most 1600 px on its long edge before keeping it,
   so a few dozen photos don't fill the phone's browser storage. */
export async function storePhoto(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('This photo format could not be opened.'))
      element.src = url
    })
    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('The photo could not be prepared.')
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('The photo could not be compressed.'))), 'image/jpeg', 0.85)
    })
    return await saveImage({ blob, type: 'image/jpeg', width, height })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logActivity('error', 'photo', `A photo could not be added: ${message}`, {
      fileType: file.type || 'unknown',
      sizeKB: Math.round(file.size / 1024),
      nextStep: 'Try taking the photo again, or choose it from the photo library.',
    })
    throw error
  } finally {
    URL.revokeObjectURL(url)
  }
}

/* ── Dictation ──────────────────────────────────────────────────────── */

interface RecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}

interface RecognitionEventLike {
  resultIndex: number
  results: ArrayLike<RecognitionResultLike>
}

interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: RecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type RecognitionConstructor = new () => RecognitionLike

function recognitionConstructor(): RecognitionConstructor | null {
  const scope = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export function dictationAvailable() {
  return recognitionConstructor() !== null
}

const DICTATION_ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone or speech permission was declined. Allow it in the phone’s Settings for this browser.',
  'service-not-allowed': 'Speech recognition is turned off for this browser. Check Settings → Screen Time or Siri & Dictation.',
  'no-speech': 'No speech was heard. Tap the microphone and try again.',
  network: 'Speech recognition needs a connection right now and couldn’t reach it.',
  'audio-capture': 'No microphone was available.',
  aborted: 'Dictation stopped.',
}

export interface DictationSession {
  stop: () => void
}

/* Listens and reports text as it is recognised. `onText` receives the
   finished phrases; `onDraft` the words still being worked out. */
export function startDictation(handlers: {
  onText: (text: string) => void
  onDraft: (text: string) => void
  onEnd: (problem: string | null) => void
}): DictationSession | null {
  const Recognition = recognitionConstructor()
  if (!Recognition) {
    logActivity('warn', 'dictation', 'This browser has no built-in speech recognition. The keyboard’s microphone key still works for dictation.')
    handlers.onEnd('This browser can’t take dictation here. Use the microphone key on your keyboard instead.')
    return null
  }
  const recognition = new Recognition()
  recognition.lang = navigator.language || 'en-US'
  recognition.continuous = true
  recognition.interimResults = true
  let problem: string | null = null

  recognition.onresult = (event) => {
    let draft = ''
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index]
      if (result.isFinal) handlers.onText(result[0].transcript)
      else draft += result[0].transcript
    }
    handlers.onDraft(draft)
  }
  recognition.onerror = (event) => {
    problem = DICTATION_ERRORS[event.error] ?? `Dictation stopped (${event.error}).`
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      logActivity('warn', 'dictation', problem, { reason: event.error })
    }
  }
  recognition.onend = () => {
    handlers.onDraft('')
    handlers.onEnd(problem === DICTATION_ERRORS.aborted ? null : problem)
  }

  try {
    recognition.start()
    logActivity('info', 'dictation', 'Started listening for dictation.')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logActivity('error', 'dictation', `Dictation could not start: ${message}`)
    handlers.onEnd('Dictation could not start. Try again in a moment.')
    return null
  }
  return { stop: () => recognition.stop() }
}
