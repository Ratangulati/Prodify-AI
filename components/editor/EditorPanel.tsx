'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Check, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useWorkspaceStore } from '@/lib/store'
import Editor from './Editor'
import type { DocumentType } from '@/lib/types'

const TYPE_LABELS: Record<DocumentType, string> = {
  prd: 'PRD',
  'user-story': 'User Story',
  research: 'Research',
  roadmap: 'Roadmap',
  general: 'Note',
}

const TYPE_COLORS: Record<DocumentType, { bg: string; text: string }> = {
  prd:          { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc' },
  'user-story': { bg: 'rgba(34,197,94,0.12)',  text: '#86efac' },
  research:     { bg: 'rgba(245,158,11,0.12)', text: '#fcd34d' },
  roadmap:      { bg: 'rgba(59,130,246,0.12)', text: '#93c5fd' },
  general:      { bg: 'rgba(107,114,128,0.12)',text: '#9ca3af' },
}

export default function EditorPanel() {
  const { documents, activeDocId, updateDocument, saveStatus } = useWorkspaceStore()
  const doc = documents.find((d) => d.id === activeDocId)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue,   setTitleValue]   = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (doc) setTitleValue(doc.title)
  }, [doc?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const commitTitle = () => {
    if (doc && titleValue.trim()) {
      updateDocument(doc.id, { title: titleValue.trim() })
    }
    setEditingTitle(false)
  }

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#0f0f0f' }}>
        <div className="text-center space-y-3">
          <p className="text-4xl">✦</p>
          <p className="text-sm font-medium" style={{ color: '#555' }}>Select or create a document</p>
          <p className="text-xs" style={{ color: '#444' }}>Use the sidebar to open a document</p>
        </div>
      </div>
    )
  }

  const typeStyle = TYPE_COLORS[doc.type]
  const savedAt   = format(new Date(doc.updatedAt), 'h:mm a')

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0f0f0f' }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#1e1e1e', background: '#111' }}
      >
        {/* Title */}
        {editingTitle ? (
          <input
            ref={titleRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTitle() }}
            autoFocus
            className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none border-b"
            style={{ color: '#f0f0f0', borderColor: '#6366f1' }}
          />
        ) : (
          <h1
            className="flex-1 min-w-0 text-sm font-semibold truncate cursor-text"
            style={{ color: '#f0f0f0' }}
            onClick={() => { setTitleValue(doc.title); setEditingTitle(true) }}
            title="Click to edit"
          >
            {doc.title}
          </h1>
        )}

        {/* Type badge */}
        <span
          className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider flex-shrink-0"
          style={{ background: typeStyle.bg, color: typeStyle.text }}
        >
          {TYPE_LABELS[doc.type]}
        </span>

        {/* Save indicator */}
        <div className="flex items-center gap-1 flex-shrink-0 min-w-[80px]">
          {saveStatus === 'saving' ? (
            <>
              <Loader2 size={11} className="animate-spin" style={{ color: '#818cf8' }} />
              <span className="text-[10px]" style={{ color: '#818cf8' }}>Saving…</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Check size={11} style={{ color: '#4ade80' }} />
              <span className="text-[10px]" style={{ color: '#4ade80' }}>Saved {savedAt}</span>
            </>
          ) : (
            <span className="text-[10px]" style={{ color: '#555' }}>Saved {savedAt}</span>
          )}
        </div>

        {/* Share */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-shrink-0"
          style={{ background: '#1e1e1e', color: '#aaa', border: '1px solid #2a2a2a' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#252525' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1e1e1e' }}
        >
          <Share2 size={12} />
          Share
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Editor docId={doc.id} />
      </div>
    </div>
  )
}
