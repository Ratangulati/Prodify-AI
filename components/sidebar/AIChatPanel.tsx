'use client'

import {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send, Copy, Check, Trash2, FileText, BookOpen,
  Map, BarChart3, FlaskConical, TrendingUp, Wand2,
  ToggleLeft, ToggleRight, ChevronRight,
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/store'
import { toast } from '@/lib/toast'
import type { AIWorkflow, AIMessage } from '@/lib/types'

/* ── Workflow tab definitions ───────────────────────────────────── */
const WORKFLOWS: {
  id: AIWorkflow
  label: string
  emoji: string
  icon: React.ReactNode
}[] = [
  { id: 'prd',            label: 'PRD',       emoji: '✍️', icon: <FileText size={12} /> },
  { id: 'stories',        label: 'Stories',   emoji: '📋', icon: <BookOpen size={12} /> },
  { id: 'roadmap',        label: 'Roadmap',   emoji: '🗺', icon: <Map size={12} /> },
  { id: 'prioritization', label: 'Prioritize',emoji: '⚖️', icon: <BarChart3 size={12} /> },
  { id: 'research',       label: 'Research',  emoji: '🔍', icon: <FlaskConical size={12} /> },
  { id: 'data',           label: 'Data',      emoji: '📊', icon: <TrendingUp size={12} /> },
]

/* ── Starter prompts per workflow ───────────────────────────────── */
const STARTERS: Record<AIWorkflow, { label: string; prompt: string }[]> = {
  prd: [
    { label: 'Draft a PRD',         prompt: 'Draft a PRD for [describe your feature or idea here]' },
    { label: 'Review for gaps',     prompt: 'Review my PRD and identify any missing sections, unclear requirements, or logical gaps.' },
    { label: 'Rewrite problem statement', prompt: 'Rewrite the problem statement in my PRD to be clearer and more compelling.' },
    { label: 'Add success metrics', prompt: 'Suggest 5 measurable success metrics for this feature based on common product KPIs.' },
  ],
  stories: [
    { label: 'Generate from PRD',   prompt: 'Generate user stories from my PRD document. Include acceptance criteria for each.' },
    { label: 'Add edge cases',      prompt: 'What edge cases am I missing in these user stories? Add Gherkin scenarios for each.' },
    { label: 'Write acceptance criteria', prompt: 'Write Gherkin-format acceptance criteria for: [describe your feature]' },
    { label: 'Break into smaller stories', prompt: 'Break this epic into smaller, independently deliverable user stories.' },
  ],
  roadmap: [
    { label: 'Sequence features',   prompt: 'Help me sequence these features into a 3-quarter roadmap: [list your features]' },
    { label: 'Plan Q2 roadmap',     prompt: 'Draft a Q2 roadmap plan based on my current feature backlog.' },
    { label: 'Identify dependencies', prompt: 'What dependencies or blockers should I be aware of for these features?' },
    { label: 'Now / Next / Later',  prompt: 'Organise these initiatives into Now / Next / Later buckets with rationale: [list initiatives]' },
  ],
  prioritization: [
    { label: 'RICE scoring',        prompt: 'Score these features using RICE and rank them: [list your features]' },
    { label: 'Apply MoSCoW',        prompt: 'Apply MoSCoW prioritisation to my backlog and explain the reasoning.' },
    { label: 'What to build first', prompt: 'Given our goals and constraints, which feature should we build first and why?' },
    { label: 'Compare trade-offs',  prompt: 'Compare the trade-offs between building [Feature A] vs [Feature B] now.' },
  ],
  research: [
    { label: 'Synthesize interviews', prompt: 'Synthesize these user interview notes into themes and insights:\n\n[paste your notes here]' },
    { label: 'Find patterns',       prompt: 'Identify patterns and recurring themes in this customer feedback:\n\n[paste feedback here]' },
    { label: 'Surface key themes',  prompt: 'What are the top 5 themes from this research data? Include supporting quotes.' },
    { label: 'Product opportunities', prompt: 'Based on this research, what product opportunities should we prioritise?' },
  ],
  data: [
    { label: 'Analyse funnel',      prompt: 'Analyse this funnel data and identify the biggest drop-off points:\n\n[paste data here]' },
    { label: 'Spot anomalies',      prompt: 'Are there any anomalies or unexpected patterns in these metrics?\n\n[paste metrics here]' },
    { label: 'Suggest A/B tests',   prompt: 'Based on this data, what A/B tests should I run to improve conversion?' },
    { label: 'Root cause analysis', prompt: 'What might be causing this drop-off in [metric]? Walk me through possible root causes.' },
  ],
  general: [
    { label: 'Ask anything',        prompt: 'How do I [describe your PM challenge]?' },
  ],
}

/* ── Markdown renderer ──────────────────────────────────────────── */
const MarkdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2.5 last:mb-0 leading-relaxed" style={{ color: '#d4d4d8', fontSize: '0.875rem' }}>
      {children}
    </p>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-base font-bold mt-4 mb-2" style={{ color: '#f4f4f5' }}>{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-bold mt-3.5 mb-1.5" style={{ color: '#f4f4f5' }}>{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold mt-3 mb-1" style={{ color: '#e4e4e7' }}>{children}</h3>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="pl-4 mb-2.5 space-y-0.5" style={{ listStyleType: 'disc', color: '#d4d4d8' }}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="pl-4 mb-2.5 space-y-0.5" style={{ listStyleType: 'decimal', color: '#d4d4d8' }}>{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed" style={{ fontSize: '0.875rem', color: '#d4d4d8' }}>{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={{ color: '#f4f4f5', fontWeight: 600 }}>{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em style={{ color: '#a1a1aa' }}>{children}</em>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote
      className="pl-3 my-2.5 text-sm italic"
      style={{ borderLeft: '2px solid #6366f1', color: '#a1a1aa', background: 'rgba(99,102,241,0.06)', padding: '0.5rem 0.75rem', borderRadius: '0 6px 6px 0' }}
    >
      {children}
    </blockquote>
  ),
  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
    inline ? (
      <code
        className="px-1.5 py-0.5 rounded text-xs"
        style={{ background: '#27272a', color: '#a78bfa', fontFamily: 'var(--font-geist-mono, monospace)', border: '1px solid #3f3f46' }}
      >
        {children}
      </code>
    ) : (
      <code style={{ display: 'block' }}>{children}</code>
    ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre
      className="rounded-lg p-3.5 my-2.5 overflow-x-auto text-xs"
      style={{ background: '#09090b', border: '1px solid #27272a', color: '#a1a1aa', fontFamily: 'var(--font-geist-mono, monospace)', lineHeight: 1.6 }}
    >
      {children}
    </pre>
  ),
  hr: () => <hr className="my-3" style={{ borderColor: '#27272a' }} />,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-3 rounded-lg" style={{ border: '1px solid #27272a' }}>
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead style={{ background: '#18181b' }}>{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr style={{ borderBottom: '1px solid #27272a' }}>{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[10px]" style={{ color: '#71717a' }}>{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-2" style={{ color: '#d4d4d8' }}>{children}</td>
  ),
}

/* ── Copy button with checkmark feedback ────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={copy}
      className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
      style={{ color: copied ? '#22c55e' : '#52525b' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = copied ? '#22c55e' : '#a1a1aa' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = copied ? '#22c55e' : '#52525b' }}
      title="Copy"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

/* ── Message bubble ──────────────────────────────────────────────── */
function MessageBubble({ msg, isStreaming }: { msg: AIMessage & { streaming?: boolean }; isStreaming?: boolean }) {
  const isUser = msg.role === 'user'
  const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[88%]">
          <div
            className="px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
            style={{ background: '#6366f1', color: '#fff' }}
          >
            {msg.content}
          </div>
          <p className="text-right mt-1 text-[10px]" style={{ color: '#3f3f46' }}>{timeStr}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5 mb-5 group">
      {/* AI avatar */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full mt-0.5"
        style={{ width: 24, height: 24, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        <Wand2 size={11} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold" style={{ color: '#818cf8' }}>AI</span>
          <span className="text-[10px]" style={{ color: '#3f3f46' }}>{timeStr}</span>
          <div className="ml-auto">
            <CopyButton text={msg.content} />
          </div>
        </div>

        <div
          className="rounded-2xl rounded-tl-sm px-3.5 py-3"
          style={{ background: '#18181b', border: '1px solid #27272a' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={MarkdownComponents as Record<string, React.ComponentType<unknown>>}
          >
            {msg.content}
          </ReactMarkdown>

          {/* Blinking cursor while streaming */}
          {isStreaming && (
            <span className="inline-block w-0.5 h-3.5 ml-0.5 rounded-full align-middle" style={{ background: '#818cf8', animation: 'blink 0.9s step-end infinite' }} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Empty state with starter prompts ───────────────────────────── */
function EmptyState({
  workflow,
  onPrompt,
}: {
  workflow: AIWorkflow
  onPrompt: (prompt: string) => void
}) {
  const wf = WORKFLOWS.find((w) => w.id === workflow)
  const starters = STARTERS[workflow] ?? []

  return (
    <div className="flex flex-col items-center px-4 py-8 gap-5">
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 44, height: 44, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}
      >
        <span className="text-xl">{wf?.emoji}</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold mb-1" style={{ color: '#e4e4e7' }}>
          {wf?.label} Assistant
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#52525b' }}>
          Your AI co-pilot for {wf?.label.toLowerCase()} work.
          <br />Try a starter below or type your own question.
        </p>
      </div>

      <div className="w-full space-y-2">
        {starters.map((s) => (
          <button
            key={s.label}
            onClick={() => onPrompt(s.prompt)}
            className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all group"
            style={{ background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = '#1e1e21'
              el.style.borderColor = '#3f3f46'
              el.style.color = '#e4e4e7'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = '#18181b'
              el.style.borderColor = '#27272a'
              el.style.color = '#a1a1aa'
            }}
          >
            <ChevronRight size={12} className="flex-shrink-0 text-indigo-500" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Main AIChatPanel ────────────────────────────────────────────── */
export default function AIChatPanel() {
  const {
    messages, addMessage,
    documents, activeDocId,
  } = useWorkspaceStore()

  const [workflow, setWorkflow] = useState<AIWorkflow>('prd')
  const [input, setInput] = useState('')
  const [useDocContext, setUseDocContext] = useState(true)
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const abortRef       = useRef<AbortController | null>(null)

  // Filter messages for current workflow
  const workflowMessages = useMemo(
    () => messages.filter((m) => m.workflow === workflow),
    [messages, workflow]
  )

  const activeDoc = documents.find((d) => d.id === activeDocId)

  // Scroll to bottom when messages change or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [workflowMessages.length, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [input])

  const handleSend = useCallback(async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim()
    if (!text || isStreaming) return

    // Build conversation history for this workflow
    const history = workflowMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Get document context if toggled on
    const docContext = useDocContext && activeDoc
      ? `Document title: ${activeDoc.title}\n\n${activeDoc.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`
      : undefined

    // Add user message to store
    addMessage({ role: 'user', content: text, workflow })
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          workflow,
          userMessage: text,
          documentContext: docContext,
          conversationHistory: history,
        }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setStreamingContent(full)
      }

      // Commit to store
      addMessage({ role: 'assistant', content: full, workflow })
      toast.info('AI response complete')
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        addMessage({
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          workflow,
        })
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent(null)
    }
  }, [input, isStreaming, workflowMessages, useDocContext, activeDoc, workflow, addMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    if (isStreaming) {
      abortRef.current?.abort()
      setIsStreaming(false)
      setStreamingContent(null)
    }
    // Only clear messages for current workflow
    useWorkspaceStore.setState((state) => ({
      messages: state.messages.filter((m) => m.workflow !== workflow),
    }))
  }

  const showEmpty = workflowMessages.length === 0 && !isStreaming

  // Build the "live" streaming message for display
  const streamingMsg: (AIMessage & { streaming: boolean }) | null = streamingContent !== null
    ? {
        id: '__streaming__',
        role: 'assistant',
        content: streamingContent,
        timestamp: new Date().toISOString(),
        workflow,
        streaming: true,
      }
    : null

  return (
    <div className="flex flex-col h-full" style={{ background: '#111113' }}>

      {/* ── Workflow tabs ───────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-b overflow-x-auto scrollbar-hide"
        style={{ borderColor: '#1e1e22', background: '#0d0d0f' }}
      >
        <div className="flex min-w-max">
          {WORKFLOWS.map((wf) => {
            const active = workflow === wf.id
            return (
              <button
                key={wf.id}
                onClick={() => setWorkflow(wf.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors relative whitespace-nowrap flex-shrink-0"
                style={{ color: active ? '#a5b4fc' : '#52525b' }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#71717a' }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#52525b' }}
              >
                <span>{wf.emoji}</span>
                <span>{wf.label}</span>
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: '#6366f1', borderRadius: '2px 2px 0 0' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Messages area ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showEmpty ? (
          <EmptyState workflow={workflow} onPrompt={(p) => { setInput(p); textareaRef.current?.focus() }} />
        ) : (
          <>
            {workflowMessages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {streamingMsg && (
              <MessageBubble msg={streamingMsg} isStreaming />
            )}
            {isStreaming && !streamingContent && (
              <div className="flex gap-2.5 mb-4">
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{ width: 24, height: 24, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <Wand2 size={11} className="text-white" />
                </div>
                <div
                  className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm"
                  style={{ background: '#18181b', border: '1px solid #27272a' }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="rounded-full"
                      style={{
                        width: 6, height: 6, background: '#6366f1',
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Bottom controls ─────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-t px-3 pt-2.5 pb-3 space-y-2.5"
        style={{ borderColor: '#1e1e22', background: '#0d0d0f' }}
      >
        {/* Doc context toggle + Clear */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setUseDocContext((v) => !v)}
            className="flex items-center gap-2 text-xs transition-colors"
            style={{ color: useDocContext ? '#818cf8' : '#3f3f46' }}
          >
            {useDocContext
              ? <ToggleRight size={16} style={{ color: '#6366f1' }} />
              : <ToggleLeft size={16} />
            }
            <span>Use document context</span>
            {useDocContext && activeDoc && (
              <span
                className="truncate max-w-[100px] text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}
                title={activeDoc.title}
              >
                {activeDoc.title}
              </span>
            )}
          </button>

          {workflowMessages.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors"
              style={{ color: '#3f3f46' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3f3f46' }}
              title="Clear conversation"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>

        {/* Input area */}
        <div
          className="flex flex-col gap-2 rounded-xl p-2.5"
          style={{ background: '#18181b', border: `1px solid ${isStreaming ? 'rgba(99,102,241,0.4)' : '#2e2e32'}` }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask the ${WORKFLOWS.find((w) => w.id === workflow)?.label} AI…`}
            rows={1}
            disabled={isStreaming}
            className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed disabled:opacity-50"
            style={{
              color: '#e4e4e7',
              caretColor: '#818cf8',
              minHeight: 36,
              maxHeight: 140,
            }}
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#3f3f46' }}>
              <kbd
                className="px-1 py-0.5 rounded text-[9px]"
                style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#52525b' }}
              >
                ⌘↵
              </kbd>
              {' '}to send
            </span>

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: input.trim() && !isStreaming ? '#6366f1' : '#27272a',
                color: input.trim() && !isStreaming ? '#fff' : '#52525b',
              }}
            >
              {isStreaming ? (
                <>
                  <span className="animate-spin inline-block"><Wand2 size={12} /></span>
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <Send size={12} />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
