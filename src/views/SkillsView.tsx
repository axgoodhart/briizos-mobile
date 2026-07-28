import { useState } from 'react';
import { Download, Filter, ArrowUpDown, Globe, Zap } from 'lucide-react';

interface Skill {
  id: string;
  title: string;
  description: string;
  tags: string[];
  author: string;
  icon: React.ReactNode;
}

const skills: Skill[] = [
{
  id: '1',
  title: 'Improve and optimize prompts for Claude using Anthropic\'s official best practices and the 5-Element Persona Framework. Use when asked to...',
  description: '',
  tags: ['AI', 'Content'],
  author: 'skeletorjs',
  icon: <div className="card-row-center-9"><span className="span-size">📝</span></div>
},
{
  id: '2',
  title: 'Create a site',
  description: 'Create a site hosted on yourbriizOSserver. Private by default, publish with a click.',
  tags: ['Web'],
  author: 'Zo',
  icon: <div className="card-row-center-9"><Globe size={18} className="icon-tone" /></div>
},
{
  id: '3',
  title: 'Install OpenClaw onbriizOS',
  description: 'Install and run OpenClaw on briizOS with Tailscale private networking, browser Control UI, andbriizOSMCP tools via mcporter. Use this skill...',
  tags: ['AI', 'Developer Tools'],
  author: 'skeletorjs',
  icon: <div className="card-row-center-9"><span className="span-size">🦞</span></div>
}];


export default function SkillsView() {
  const [activeTab, setActiveTab] = useState<'installed' | 'hub'>('hub');

  return (
    <div className="stack-3">
      {/* Tabs */}
      <div className="row-28">
        <button
          onClick={() => setActiveTab('installed')}
          className={`row-small-9 ${activeTab === 'installed' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
          
          <Download size={14} /> Installed
        </button>
        <button
          onClick={() => setActiveTab('hub')}
          className={`row-small-9 ${activeTab === 'hub' ? 'bg-[#2a2a45] text-white' : 'text-gray-500'}`}>
          
          <Zap size={14} /> Hub
        </button>
        <div className="div-styled-2" />
        <button className="zo-btn-icon"><Filter size={14} /></button>
        <button className="zo-btn-icon"><ArrowUpDown size={14} /></button>
      </div>

      {/* Skills list */}
      <div className="scroll-6">
        {skills.map((skill) =>
        <div key={skill.id} className="zo-card div-spacing-9">
            <div className="row-7">
              {skill.icon}
              <div className="div-size">
                <div className="row-spread-7">
                  <h3 className="small-39">{skill.title}</h3>
                  <button className="zo-btn-icon button-spacing-2">
                    <Download size={14} />
                  </button>
                </div>
                {skill.description &&
              <p className="small-40">{skill.description}</p>
              }
                <div className="row-spread-8">
                  <div className="row-6">
                    {skill.tags.map((tag) =>
                  <span key={tag} className="card-small-8">{tag}</span>
                  )}
                  </div>
                  <span className="small-5">{skill.author}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>);

}