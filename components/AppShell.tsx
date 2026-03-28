'use client'

import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/lib/store'
import LeftSidebar from './sidebar/LeftSidebar'
import EditorPanel from './editor/EditorPanel'
import RightPanel from './sidebar/RightPanel'
import ToastContainer from './ui/Toast'
import CommandPalette from './modals/CommandPalette'
import KeyboardShortcuts from './modals/KeyboardShortcuts'
import WelcomeScreen from './onboarding/WelcomeScreen'

export default function AppShell() {
  const {
    documents, theme, setTheme,
    addDocument, setActiveDoc, setActiveSidebarTab,
    activeSidebarTab,
  } = useWorkspaceStore()

  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [shortcutsOpen,  setShortcutsOpen]  = useState(false)

  /* ── Apply theme class to <html> ─────────────────────────────── */
  useEffect(() => {
    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
      html.classList.remove('light')
    } else {
      html.classList.remove('dark')
      html.classList.add('light')
    }
  }, [theme])

  /* ── Global keyboard shortcuts ───────────────────────────────── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName

      // CMD+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdPaletteOpen(true)
        return
      }
      // CMD+N → new general note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        const id = addDocument({ title: 'Untitled Note', content: '', type: 'general', tags: [] })
        setActiveDoc(id)
        return
      }
      // CMD+/ → cycle AI sidebar tabs
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        const tabs = ['chat', 'roadmap', 'prioritize', 'research', 'data']
        const idx  = tabs.indexOf(activeSidebarTab)
        setActiveSidebarTab(tabs[(idx + 1) % tabs.length])
        return
      }
      // ? → keyboard shortcuts (not when in input/textarea/contenteditable)
      if (
        e.key === '?' &&
        tag !== 'INPUT' && tag !== 'TEXTAREA' &&
        !(e.target as HTMLElement).isContentEditable &&
        !e.metaKey && !e.ctrlKey
      ) {
        setShortcutsOpen(true)
        return
      }
      // Esc → close modals
      if (e.key === 'Escape') {
        setCmdPaletteOpen(false)
        setShortcutsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSidebarTab, addDocument, setActiveDoc, setActiveSidebarTab])

  const noDocuments = documents.length === 0

  return (
    <>
      {/* Main layout */}
      <div
        className="flex h-screen overflow-hidden"
        style={{
          minWidth: 1024,
          background: theme === 'dark' ? '#0f0f0f' : '#f5f5f5',
          overflowX: 'auto',
        }}
      >
        <LeftSidebar onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} theme={theme} />

        {/* Centre: onboarding or editor */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
          {noDocuments ? <WelcomeScreen /> : <EditorPanel />}
        </div>

        <RightPanel />
      </div>

      {/* Overlays */}
      <CommandPalette   open={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />
      <KeyboardShortcuts open={shortcutsOpen}  onClose={() => setShortcutsOpen(false)} />
      <ToastContainer />
    </>
  )
}
