import { useState } from 'react'
import { Terminal } from 'lucide-react'

interface Command {
  prompt: string
  branch?: string
  dir?: string
  command: string
  output?: string
  error?: boolean
}

const terminalData: Command[] = [
  { prompt: 'workspace', branch: 'master', dir: 'workspace', command: 'cwd', output: 'zsh: command not found: cwd', error: true },
  { prompt: 'workspace', branch: 'master', dir: 'workspace', command: 'pwd', output: '/home/workspace' },
  { prompt: 'workspace', branch: 'master', dir: 'workspace', command: 'mkdir recollections' },
  { prompt: 'workspace', branch: 'master', dir: 'workspace', command: 'cd recollections' },
  { prompt: 'recollections', branch: 'master', dir: 'recollections', command: 'nano boost.txt' }
]

export default function ChatsView() {
  const [activeView, setActiveView] = useState<'chats' | 'terminal'>('terminal')

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      {/* View toggle */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#252540]">
        <button
          onClick={() => setActiveView('chats')}
          className={`text-sm px-3 py-1 rounded-lg transition-all ${activeView === 'chats' ? 'bg-[#252540] text-white' : 'text-gray-500'}`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveView('terminal')}
          className={`text-sm px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${activeView === 'terminal' ? 'bg-[#252540] text-white' : 'text-gray-500'}`}
        >
          <Terminal size={14} /> Terminal
        </button>
      </div>

      {activeView === 'terminal' ? (
        <div className="flex-1 p-4 overflow-y-auto terminal-text text-sm">
          {terminalData.map((cmd, i) => (
            <div key={i} className="mb-1">
              <div className="flex items-center gap-2">
                <span className="text-teal-400">→</span>
                <span className="text-cyan-400">{cmd.prompt}</span>
                <span className="text-gray-500">git:</span>
                <span className="text-orange-400">({cmd.branch})</span>
                <span className="text-gray-400">{cmd.command}</span>
                {i === terminalData.length - 1 && (
                  <span className="w-2 h-4 bg-purple-400 animate-pulse ml-1" />
                )}
              </div>
              {cmd.output && (
                <div className={`ml-6 ${cmd.error ? 'text-red-400' : 'text-gray-300'}`}>
                  {cmd.output}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 p-4">
          <div className="text-center text-gray-500 mt-20">
            <MessageSquareIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-sm">No active chats</p>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
