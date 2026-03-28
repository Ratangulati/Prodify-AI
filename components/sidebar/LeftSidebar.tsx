'use client'

import { useState } from 'react'
import {
  Sparkles, ChevronDown, ChevronRight, FileText,
  BookOpen, FlaskConical, Map, LayoutDashboard, Circle, Plus,
  User, Sun, Moon, Keyboard,
} from 'lucide-react'
import type { Theme } from '@/lib/types'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWorkspaceStore } from '@/lib/store'
import type { DocumentType, FeatureStatus } from '@/lib/types'
import { toast } from '@/lib/toast'

const DOC_GROUPS: { label: string; type: DocumentType; icon: React.ReactNode }[] = [
  { label: 'PRDs', type: 'prd', icon: <FileText size={13} /> },
  { label: 'User Stories', type: 'user-story', icon: <BookOpen size={13} /> },
  { label: 'Research', type: 'research', icon: <FlaskConical size={13} /> },
  { label: 'Roadmap', type: 'roadmap', icon: <Map size={13} /> },
  { label: 'General', type: 'general', icon: <LayoutDashboard size={13} /> },
]

const STATUS_COLORS: Record<FeatureStatus, string> = {
  Now: '#22c55e',
  Next: '#6366f1',
  Later: '#f59e0b',
  Done: '#6b7280',
}

const NEW_DOC_OPTIONS: { label: string; type: DocumentType }[] = [
  { label: 'PRD', type: 'prd' },
  { label: 'User Story', type: 'user-story' },
  { label: 'Research Note', type: 'research' },
  { label: 'Roadmap Doc', type: 'roadmap' },
  { label: 'General Note', type: 'general' },
]

interface LeftSidebarProps {
  onToggleTheme: () => void
  theme: Theme
}

export default function LeftSidebar({ onToggleTheme, theme }: LeftSidebarProps) {
  const { documents, features, activeDocId, setActiveDoc, addDocument } = useWorkspaceStore()
  const [collapsed, setCollapsed] = useState<Partial<Record<DocumentType, boolean>>>({})

  const toggle = (type: DocumentType) =>
    setCollapsed((prev) => ({ ...prev, [type]: !prev[type] }))

  const handleNewDoc = (type: DocumentType) => {
    const titles: Record<DocumentType, string> = {
      prd: 'Untitled PRD',
      'user-story': 'Untitled User Story',
      research: 'Untitled Research',
      roadmap: 'Untitled Roadmap',
      general: 'Untitled Note',
    }
    const id = addDocument({ title: titles[type], content: '', type, tags: [] })
    setActiveDoc(id)
    toast.success(`Created ${titles[type]}`)
  }

  const statusCounts = features.reduce<Record<string, number>>((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1
    return acc
  }, {})

  return (
    <aside
      className="flex flex-col h-full border-r"
      style={{ width: 240, minWidth: 240, background: '#1a1a1a', borderColor: '#2a2a2a' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: '#2a2a2a' }}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 28, height: 28, background: '#6366f1' }}
        >
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-white">PM Cursor</span>
      </div>

      {/* New Doc Button */}
      <div className="px-3 pt-3 pb-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{ background: '#6366f1', color: '#fff' }}
          >
            <Plus size={13} />
            New Document
            <ChevronDown size={11} className="ml-auto opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48 border text-xs"
            style={{ background: '#1e1e1e', borderColor: '#2a2a2a', color: '#e5e5e5' }}
          >
            {NEW_DOC_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.type}
                className="text-xs cursor-pointer"
                onClick={() => handleNewDoc(opt.type)}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Document Tree */}
      <ScrollArea className="flex-1 px-2 py-1">
        <div className="space-y-0.5">
          {DOC_GROUPS.map(({ label, type, icon }) => {
            const docs = documents.filter((d) => d.type === type)
            const isOpen = !collapsed[type]
            return (
              <div key={type}>
                {/* Group header */}
                <button
                  onClick={() => toggle(type)}
                  className="flex items-center gap-1.5 w-full px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-white/5"
                  style={{ color: '#888' }}
                >
                  {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  <span className="text-[10px] uppercase tracking-wider">{label}</span>
                  <span
                    className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: '#2a2a2a', color: '#666' }}
                  >
                    {docs.length}
                  </span>
                </button>

                {/* Doc items */}
                {isOpen && docs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDoc(doc.id)}
                    className="flex items-center gap-2 w-full pl-6 pr-2 py-1 rounded text-xs transition-colors group"
                    style={{
                      color: activeDocId === doc.id ? '#a5b4fc' : '#aaa',
                      background: activeDocId === doc.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                    }}
                  >
                    <span style={{ color: activeDocId === doc.id ? '#6366f1' : '#555' }}>{icon}</span>
                    <span className="truncate leading-tight">{doc.title}</span>
                  </button>
                ))}

                {isOpen && docs.length === 0 && (
                  <p className="pl-7 py-1 text-[10px]" style={{ color: '#555' }}>No documents yet</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Features section */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#2a2a2a' }}>
          <p className="px-2 mb-2 text-[10px] uppercase tracking-wider font-medium" style={{ color: '#666' }}>
            Features
          </p>
          <div className="grid grid-cols-2 gap-1 px-1">
            {(['Now', 'Next', 'Later', 'Done'] as FeatureStatus[]).map((s) => (
              <div
                key={s}
                className="flex items-center justify-between px-2 py-1.5 rounded-md"
                style={{ background: '#222' }}
              >
                <div className="flex items-center gap-1.5">
                  <Circle size={6} fill={STATUS_COLORS[s]} stroke="none" />
                  <span className="text-[11px]" style={{ color: '#888' }}>{s}</span>
                </div>
                <span className="text-[11px] font-semibold" style={{ color: STATUS_COLORS[s] }}>
                  {statusCounts[s] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Bottom bar */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-t"
        style={{ borderColor: '#2a2a2a' }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 26, height: 26, background: '#333', color: '#aaa', flexShrink: 0 }}
        >
          <User size={13} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium truncate" style={{ color: '#ddd' }}>Product Manager</p>
        </div>
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded transition-colors hover:bg-white/10 flex-shrink-0"
          style={{ color: '#555' }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
        <div className="flex-shrink-0" style={{ color: '#555' }} title="Press ? for shortcuts">
          <Keyboard size={13} />
        </div>
      </div>
    </aside>
  )
}
