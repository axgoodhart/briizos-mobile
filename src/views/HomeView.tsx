import { useState } from 'react';
import { ChevronDown, Plus, ArrowUp, Sparkles, Atom } from 'lucide-react';

export default function HomeView() {
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('GPT-5.4 mini');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [expandModelMenu, setExpandModelMenu] = useState(false);

  const models = ['GPT-5.4 mini', 'GPT-5.4', 'Claude 3.5', 'Claude 3.7'];

  return (
    <div className="home-view">
      {/* Main content area */}
      <div className="stack-center">
        {/* Chat input card */}
        <div className="card-10">
          <textarea id="chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="What can I do for you?"
            className="textarea-tone-2" />

          <div className={expandModelMenu ? 'row-8 expand' : 'row-8'}>
            {/*briizOSicon */}
            <div className="card-row-center-8">
              <button onClick={() => setExpandModelMenu(!expandModelMenu)} className="expander-toggle">  <Atom size={16} className="atom-tone" /></button>

            </div>
            {/* Model selector */}
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="card-row-small-8">

              <Sparkles size={14} />
              {selectedModel}
              <ChevronDown size={14} />
            </button>
            <div className="card-row-small-9">
              <span className="span-tone-4" id="connectionIndicator">API  🔑</span>
            </div>
            <div className="div-styled-2" />
            <button className="card-row-center-3">
              <Plus size={16} />
            </button>
            <button className="card-row-center-3">
              <ArrowUp size={16} />
            </button>
          </div>

          {showModelMenu &&
            <div className="card-floating">
              {models.map((m) =>
                <button
                  key={m}
                  onClick={() => { setSelectedModel(m); setShowModelMenu(false); }}
                  className="small-29">

                  {m}
                </button>
              )}
            </div>
          }
        </div>

        {/* History */}
        <div className="div-size-2">
          <h3 className="h3-spacing">History</h3>
          <div className="row-17">
            <p className="small-7">Job Search</p>
            <p className="small-20" id="historyConversation">update profile landing</p>

          </div>
        </div>
      </div>

    </div>);

}

/* function GridIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}*/
