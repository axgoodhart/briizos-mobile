import { useState } from 'react'
import { ChevronDown, Clock, SlidersHorizontal, Sun, Calendar, ChevronLeft, PenLine, BellOff, Zap, ArrowUp, Sparkles } from 'lucide-react'

export default function AutomationsView() {
  const [schedule, setSchedule] = useState('Daily')
  const [time] = useState('2:00 AM')
  const [automationPrompt, setAutomationPrompt] = useState('')
  const [persona] = useState('Zo')

  const schedules = ['Once', 'Custom', 'Daily', 'Weekly', 'Monthly']

  return (
    <div className="h-full flex flex-col bg-[#16162a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#252540]">
        <button className="flex items-center gap-2 text-gray-400">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-white font-medium">New Automation</h2>
          <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
            <PenLine size={14} />
          </button>
        </div>
        <button className="px-4 py-1.5 rounded-full bg-[#4a4a6a] text-white text-sm">
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Schedule description */}
        <div className="relative">
          <input
            type="text"
            placeholder="Describe a schedule..."
            className="w-full bg-[#1e1e35] border border-[#2a2a45] rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none"
          />
          <button className="absolute right-3 top-3 text-gray-500">
            <span className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center text-xs">i</span>
          </button>
        </div>

        {/* Schedule buttons */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {schedules.map(s => (
            <button
              key={s}
              onClick={() => setSchedule(s)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                schedule === s
                  ? 'bg-[#2a2a45] text-white border border-[#3a3a55]'
                  : 'text-gray-500 border border-[#2a2a45]'
              }`}
            >
              {s === 'Once' && <Clock size={14} />}
              {s === 'Custom' && <SlidersHorizontal size={14} />}
              {s === 'Daily' && <Sun size={14} />}
              {(s === 'Weekly' || s === 'Monthly') && <Calendar size={14} />}
              {s}
            </button>
          ))}
        </div>

        {/* Time selector */}
        <button className="w-full flex items-center justify-between bg-[#1e1e35] border border-[#2a2a45] rounded-xl px-4 py-3 text-white">
          <span>{time}</span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {/* Prompt to notify */}
        <div className="flex items-start gap-3">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e1e35] border border-[#2a2a45] text-gray-400 text-sm whitespace-nowrap">
            <BellOff size={14} /> Prompt to notify
          </button>
          <p className="text-gray-500 text-sm">
            In your prompt, you can ask Zo to text or email you under certain conditions.
          </p>
        </div>

        {/* Persona selector */}
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1e35] border border-[#2a2a45] text-white text-sm">
          <Zap size={14} className="text-purple-400" />
          {persona}
          <ChevronDown size={14} className="text-gray-500 ml-2" />
        </button>

        {/* Main prompt input */}
        <div className="bg-[#1e1e35] border border-[#2a2a45] rounded-2xl p-4">
          <textarea
            value={automationPrompt}
            onChange={(e) => setAutomationPrompt(e.target.value)}
            placeholder="What can I do for you?"
            className="w-full bg-transparent text-white placeholder-gray-500 text-base resize-none outline-none min-h-[80px]"
          />
          <div className="flex items-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-lg bg-[#2a2a45] flex items-center justify-center">
              <Zap size={14} className="text-purple-400" />
            </div>
            <button className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a2a45] text-sm text-gray-300">
              <Sparkles size={12} />
              GPT-5.4 mini
              <ChevronDown size={12} />
            </button>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#2a2a45] text-sm">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-gray-300">Free</span>
            </div>
            <div className="flex-1" />
            <button className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
              <ArrowUp size={14} />
            </button>
          </div>
        </div>

        <p className="text-gray-500 text-sm">Run the prompt to preview behavior before saving.</p>
      </div>
    </div>
  )
}
