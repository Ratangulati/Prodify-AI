import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  Workspace,
  Document,
  Feature,
  AIMessage,
  ResearchInsight,
  SaveStatus,
} from './types'

const now = new Date().toISOString()

const initialDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'AI-Powered Onboarding Flow — PRD',
    content: '<h1>AI-Powered Onboarding Flow</h1><p>This document outlines the product requirements for our new AI-powered onboarding experience.</p>',
    type: 'prd',
    createdAt: now,
    updatedAt: now,
    tags: ['onboarding', 'ai', 'growth'],
  },
  {
    id: 'doc-2',
    title: 'User Research: Activation Drop-off',
    content: '<h1>User Research Summary</h1><p>Key findings from 20 user interviews on activation funnel drop-off points.</p>',
    type: 'research',
    createdAt: now,
    updatedAt: now,
    tags: ['research', 'activation', 'ux'],
  },
]

function calcRice(reach: number, impact: number, confidence: number, effort: number): number {
  if (effort === 0) return 0
  return Math.round((reach * impact * (confidence / 100)) / effort)
}

const initialFeatures: Feature[] = [
  {
    id: 'feat-1',
    title: 'Smart Onboarding Checklist',
    description: 'Personalised checklist that adapts based on user role and goals detected during sign-up.',
    status: 'Now',
    priority: 'P0',
    reach: 5000,
    impact: 3,
    confidence: 80,
    effort: 2,
    riceScore: calcRice(5000, 3, 80, 2),
    moscow: 'Must',
    assignee: 'Alice',
    dueDate: '2026-04-30',
    linkedDocId: 'doc-1',
  },
  {
    id: 'feat-2',
    title: 'In-app Tooltip Coach',
    description: 'Contextual tooltips powered by AI that guide users through complex workflows.',
    status: 'Next',
    priority: 'P1',
    reach: 3000,
    impact: 2,
    confidence: 70,
    effort: 3,
    riceScore: calcRice(3000, 2, 70, 3),
    moscow: 'Should',
    assignee: 'Bob',
    dueDate: '2026-06-15',
    linkedDocId: 'doc-1',
  },
  {
    id: 'feat-3',
    title: 'Activation Email Sequence',
    description: 'Automated email drip triggered by key in-app actions to re-engage users who dropped off.',
    status: 'Next',
    priority: 'P1',
    reach: 8000,
    impact: 2,
    confidence: 90,
    effort: 1,
    riceScore: calcRice(8000, 2, 90, 1),
    moscow: 'Must',
    assignee: 'Carol',
    dueDate: '2026-05-20',
    linkedDocId: null,
  },
  {
    id: 'feat-4',
    title: 'Dark Mode',
    description: 'Full dark mode support across the application.',
    status: 'Later',
    priority: 'P3',
    reach: 2000,
    impact: 1,
    confidence: 95,
    effort: 2,
    riceScore: calcRice(2000, 1, 95, 2),
    moscow: 'Could',
    assignee: '',
    dueDate: '',
    linkedDocId: null,
  },
]

interface WorkspaceActions {
  // Document actions
  addDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateDocument: (id: string, updates: Partial<Document>) => void
  deleteDocument: (id: string) => void
  setActiveDoc: (id: string | null) => void

  // Feature actions
  addFeature: (feature: Omit<Feature, 'id' | 'riceScore'>) => string
  updateFeature: (id: string, updates: Partial<Omit<Feature, 'id'>>) => void
  deleteFeature: (id: string) => void

  // AI message actions
  addMessage: (msg: Omit<AIMessage, 'id' | 'timestamp'>) => string
  clearMessages: () => void

  // Insight actions
  addInsight: (insight: Omit<ResearchInsight, 'id'>) => string
  updateInsight: (id: string, updates: Partial<ResearchInsight>) => void
  deleteInsight: (id: string) => void

  // UI actions
  setActiveSidebarTab: (tab: string) => void
  setTheme: (t: 'dark' | 'light') => void
  setSaveStatus: (s: SaveStatus) => void
}

export const useWorkspaceStore = create<Workspace & WorkspaceActions>((set) => ({
  documents: initialDocuments,
  features: initialFeatures,
  messages: [],
  insights: [],
  activeDocId: 'doc-1',
  activeSidebarTab: 'chat',
  theme: 'dark' as const,
  saveStatus: 'idle' as SaveStatus,

  // --- Document actions ---
  addDocument: (doc) => {
    const id = uuidv4()
    const ts = new Date().toISOString()
    set((state) => ({
      documents: [...state.documents, { ...doc, id, createdAt: ts, updatedAt: ts }],
    }))
    return id
  },
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    })),
  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      activeDocId: state.activeDocId === id ? null : state.activeDocId,
    })),
  setActiveDoc: (id) => set({ activeDocId: id }),

  // --- Feature actions ---
  addFeature: (feature) => {
    const id = uuidv4()
    const riceScore = calcRice(feature.reach, feature.impact, feature.confidence, feature.effort)
    set((state) => ({
      features: [...state.features, { ...feature, id, riceScore }],
    }))
    return id
  },
  updateFeature: (id, updates) =>
    set((state) => ({
      features: state.features.map((f) => {
        if (f.id !== id) return f
        const updated = { ...f, ...updates }
        updated.riceScore = calcRice(updated.reach, updated.impact, updated.confidence, updated.effort)
        return updated
      }),
    })),
  deleteFeature: (id) =>
    set((state) => ({
      features: state.features.filter((f) => f.id !== id),
    })),

  // --- AI message actions ---
  addMessage: (msg) => {
    const id = uuidv4()
    const timestamp = new Date().toISOString()
    set((state) => ({
      messages: [...state.messages, { ...msg, id, timestamp }],
    }))
    return id
  },
  clearMessages: () => set({ messages: [] }),

  // --- Insight actions ---
  addInsight: (insight) => {
    const id = uuidv4()
    set((state) => ({
      insights: [...state.insights, { ...insight, id }],
    }))
    return id
  },
  updateInsight: (id, updates) =>
    set((state) => ({
      insights: state.insights.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),
  deleteInsight: (id) =>
    set((state) => ({
      insights: state.insights.filter((i) => i.id !== id),
    })),

  // --- UI actions ---
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setTheme: (theme) => set({ theme }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
}))
