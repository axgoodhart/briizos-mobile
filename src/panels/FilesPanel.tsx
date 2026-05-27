import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FileText, Image, Plus, SlidersHorizontal, Search, Trash2 } from 'lucide-react'

interface FileItem {
  id: string
  name: string
  type: 'folder' | 'image' | 'svg' | 'doc'
  expanded?: boolean
  children?: FileItem[]
}

const fileData: FileItem[] = [
  {
    id: '1',
    name: 'Articles',
    type: 'folder',
    expanded: false,
    children: []
  },
  {
    id: '2',
    name: 'Images',
    type: 'folder',
    expanded: true,
    children: [
      { id: '2a', name: 'bountiful.jpg', type: 'image' },
      { id: '2b', name: 'pegasus.svg', type: 'svg' }
    ]
  },
  { id: '3', name: 'Getting Started', type: 'doc' }
]

export default function FilesPanel() {
  const [files, setFiles] = useState(fileData)
  const [sortAsc, setSortAsc] = useState(true)

  const toggleFolder = (id: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) return { ...f, expanded: !f.expanded }
      return f
    }))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder size={18} className="text-gray-400" />
      case 'image': return <Image size={18} className="text-teal-400" />
      case 'svg': return <Image size={18} className="text-gray-400" />
      case 'doc': return <FileText size={18} className="text-gray-400" />
      default: return <FileText size={18} className="text-gray-400" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-medium text-white italic">Files</h2>
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white">×</button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2">
        <button className="zo-btn-icon">
          <span className="text-lg">?</span>
        </button>
        <div className="flex items-center gap-2">
          <button className="zo-btn-icon"><SlidersHorizontal size={16} /></button>
          <button className="zo-btn-icon"><Search size={16} /></button>
          <button className="zo-btn-icon"><Trash2 size={16} /></button>
        </div>
      </div>

      {/* Sort */}
      <button
        onClick={() => setSortAsc(!sortAsc)}
        className="flex items-center gap-1 px-4 py-2 text-gray-400 text-sm"
      >
        Name <ChevronDown size={14} className={`transition-transform ${sortAsc ? 'rotate-180' : ''}`} />
      </button>

      {/* File list */}
      <div className="flex-1 px-4 overflow-y-auto">
        {files.map(file => (
          <div key={file.id}>
            <button
              onClick={() => file.type === 'folder' && toggleFolder(file.id)}
              className="flex items-center gap-3 w-full py-3 text-left"
            >
              {file.type === 'folder' && (
                <span className="text-gray-500">
                  {file.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
              {getIcon(file.type)}
              <span className="text-white text-sm">{file.name}</span>
            </button>
            {file.type === 'folder' && file.expanded && file.children && (
              <div className="ml-6 border-l-2 border-[#2a2a45] pl-3">
                {file.children.map(child => (
                  <div key={child.id} className="flex items-center gap-3 py-2.5">
                    {getIcon(child.type)}
                    <span className="text-white text-sm">{child.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating add button */}
      <div className="absolute bottom-20 right-4">
        <button className="w-14 h-14 rounded-full bg-[#2a2a45] border border-[#3a3a55] flex items-center justify-center text-white shadow-lg">
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}
