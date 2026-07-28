import { useState } from 'react';
import { ChevronDown, Clock, SlidersHorizontal, Sun, Calendar, ChevronLeft, PenLine, BellOff, Zap, ArrowUp, Sparkles } from 'lucide-react';

export default function AutomationsView() {
  const [schedule, setSchedule] = useState('Daily');
  const [time] = useState('2:00 AM');
  const [automationPrompt, setAutomationPrompt] = useState('');
  const [persona] = useState('Zo');

  const schedules = ['Once', 'Custom', 'Daily', 'Weekly', 'Monthly'];

  return (
    <div className="stack-3">
      {/* Header */}
      <div className="row-spread-2">
        <button className="row-5">
          <ChevronLeft size={18} />
        </button>
        <div className="row-6">
          <h2 className="h2-tone">New Automation</h2>
          <button className="card-row-center-3">
            <PenLine size={14} />
          </button>
        </div>
        <button className="card-small-3">
          Save
        </button>
      </div>

      <div className="scroll-2">
        {/* Schedule description */}
        <div className="div-styled">
          <input
            type="text"
            placeholder="Describe a schedule..."
            className="card-3" />
          
          <button className="floating">
            <span className="row-center-small">i</span>
          </button>
        </div>

        {/* Schedule buttons */}
        <div className="row-scroll-2">
          {schedules.map((s) =>
          <button
            key={s}
            onClick={() => setSchedule(s)}
            className={`row-small-2 ${
            schedule === s ?
            'bg-[#2a2a45] text-white border border-[#3a3a55]' :
            'text-gray-500 border border-[#2a2a45]'}`
            }>
            
              {s === 'Once' && <Clock size={14} />}
              {s === 'Custom' && <SlidersHorizontal size={14} />}
              {s === 'Daily' && <Sun size={14} />}
              {(s === 'Weekly' || s === 'Monthly') && <Calendar size={14} />}
              {s}
            </button>
          )}
        </div>

        {/* Time selector */}
        <button className="card-row-spread">
          <span>{time}</span>
          <ChevronDown size={16} className="chevrondown-tone" />
        </button>

        {/* Prompt to notify */}
        <div className="row-7">
          <button className="card-row-small">
            <BellOff size={14} /> Prompt to notify
          </button>
          <p className="small-7">
            In your prompt, you can askbriizOSto text or email you under certain conditions.
          </p>
        </div>

        {/* Persona selector */}
        <button className="card-row-small-2">
          <Zap size={14} className="zap-tone" />
          {persona}
          <ChevronDown size={14} className="chevrondown-spacing" />
        </button>

        {/* Main prompt input */}
        <div className="card-4">
          <textarea
            value={automationPrompt}
            onChange={(e) => setAutomationPrompt(e.target.value)}
            placeholder="What can I do for you?"
            className="textarea-tone" />
          
          <div className="row-8">
            <div className="card-row-center-4">
              <Zap size={14} className="zap-tone" />
            </div>
            <button className="card-row-small-3">
              <Sparkles size={12} />
              GPT-5.4 mini
              <ChevronDown size={12} />
            </button>
            <div className="card-row-small-4">
              <span className="card-5" />
              <span className="span-tone-4">Free</span>
            </div>
            <div className="div-styled-2" />
            <button className="card-row-center-3">
              <ArrowUp size={14} />
            </button>
          </div>
        </div>

        <p className="small-7">Run the prompt to preview behavior before saving.</p>
      </div>
    </div>);

}