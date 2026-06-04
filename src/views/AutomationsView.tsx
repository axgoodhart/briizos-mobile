import { useState } from 'react';
import { ChevronDown, Clock, SlidersHorizontal, Sun, Calendar, ChevronLeft, PenLine, BellOff, Zap, ArrowUp, Sparkles } from 'lucide-react';

export default function AutomationsView() {
  const [schedule, setSchedule] = useState('Daily');
  const [time] = useState('2:00 AM');
  const [automationPrompt, setAutomationPrompt] = useState('');
  const [persona] = useState('Zo');

  const schedules = ['Once', 'Custom', 'Daily', 'Weekly', 'Monthly'];

  return (
    <div style-id="stylo-55" className="h-full flex flex-col bg-[#000]">
      {/* Header */}
      <div style-id="stylo-56" className="flex items-center justify-between px-4 py-3 border-b border-[#252540]">
        <button style-id="stylo-57" className="flex items-center gap-2 text-gray-400">
          <ChevronLeft style-id="stylo-58" size={18} />
        </button>
        <div style-id="stylo-59" className="flex items-center gap-2">
          <h2 style-id="stylo-60" className="text-white font-medium">New Automation</h2>
          <button style-id="stylo-61" className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
            <PenLine style-id="stylo-62" size={14} />
          </button>
        </div>
        <button style-id="stylo-63" className="px-4 py-1.5 rounded-full bg-[#4a4a6a] text-white text-sm">
          Save
        </button>
      </div>

      <div style-id="stylo-64" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Schedule description */}
        <div style-id="stylo-65" className="relative">
          <input style-id="stylo-66"
          type="text"
          placeholder="Describe a schedule..."
          className="w-full bg-[#1e1e35] border border-[#2a2a45] rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none" />
          
          <button style-id="stylo-67" className="absolute right-3 top-3 text-gray-500">
            <span style-id="stylo-68" className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center text-xs">i</span>
          </button>
        </div>

        {/* Schedule buttons */}
        <div style-id="stylo-69" className="flex items-center gap-2 overflow-x-auto">
          {schedules.map((s) =>
          <button style-id="stylo-70"
          key={s}
          onClick={() => setSchedule(s)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
          schedule === s ?
          'bg-[#2a2a45] text-white border border-[#3a3a55]' :
          'text-gray-500 border border-[#2a2a45]'}`
          }>
            
              {s === 'Once' && <Clock style-id="stylo-71" size={14} />}
              {s === 'Custom' && <SlidersHorizontal style-id="stylo-72" size={14} />}
              {s === 'Daily' && <Sun style-id="stylo-73" size={14} />}
              {(s === 'Weekly' || s === 'Monthly') && <Calendar style-id="stylo-74" size={14} />}
              {s}
            </button>
          )}
        </div>

        {/* Time selector */}
        <button style-id="stylo-75" className="w-full flex items-center justify-between bg-[#1e1e35] border border-[#2a2a45] rounded-xl px-4 py-3 text-white">
          <span style-id="stylo-76">{time}</span>
          <ChevronDown style-id="stylo-77" size={16} className="text-gray-500" />
        </button>

        {/* Prompt to notify */}
        <div style-id="stylo-78" className="flex items-start gap-3">
          <button style-id="stylo-79" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e1e35] border border-[#2a2a45] text-gray-400 text-sm whitespace-nowrap">
            <BellOff style-id="stylo-80" size={14} /> Prompt to notify
          </button>
          <p style-id="stylo-81" className="text-gray-500 text-sm">
            In your prompt, you can ask Zo to text or email you under certain conditions.
          </p>
        </div>

        {/* Persona selector */}
        <button style-id="stylo-82" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1e35] border border-[#2a2a45] text-white text-sm">
          <Zap style-id="stylo-83" size={14} className="text-purple-400" />
          {persona}
          <ChevronDown style-id="stylo-84" size={14} className="text-gray-500 ml-2" />
        </button>

        {/* Main prompt input */}
        <div style-id="stylo-85" className="bg-[#1e1e35] border border-[#2a2a45] rounded-2xl p-4">
          <textarea style-id="stylo-86"
          value={automationPrompt}
          onChange={(e) => setAutomationPrompt(e.target.value)}
          placeholder="What can I do for you?"
          className="w-full bg-transparent text-white placeholder-gray-500 text-base resize-none outline-none min-h-[80px]" />
          
          <div style-id="stylo-87" className="flex items-center gap-2 mt-2">
            <div style-id="stylo-88" className="w-7 h-7 rounded-lg bg-[#2a2a45] flex items-center justify-center">
              <Zap style-id="stylo-89" size={14} className="text-purple-400" />
            </div>
            <button style-id="stylo-90" className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a2a45] text-sm text-gray-300">
              <Sparkles style-id="stylo-91" size={12} />
              GPT-5.4 mini
              <ChevronDown style-id="stylo-92" size={12} />
            </button>
            <div style-id="stylo-93" className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#2a2a45] text-sm">
              <span style-id="stylo-94" className="w-2 h-2 rounded-full bg-orange-400" />
              <span style-id="stylo-95" className="text-gray-300">Free</span>
            </div>
            <div style-id="stylo-96" className="flex-1" />
            <button style-id="stylo-97" className="w-8 h-8 rounded-lg bg-[#2a2a45] flex items-center justify-center text-gray-400">
              <ArrowUp style-id="stylo-98" size={14} />
            </button>
          </div>
        </div>

        <p style-id="stylo-99" className="text-gray-500 text-sm">Run the prompt to preview behavior before saving.</p>
      </div>
    </div>);

}