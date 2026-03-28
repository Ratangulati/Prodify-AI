export type DocumentType = 'prd' | 'user-story' | 'research' | 'roadmap' | 'general'

export interface Document {
  id: string
  title: string
  content: string
  type: DocumentType
  createdAt: string
  updatedAt: string
  tags: string[]
}

export type FeatureStatus = 'Now' | 'Next' | 'Later' | 'Done'
export type FeaturePriority = 'P0' | 'P1' | 'P2' | 'P3'
export type MoscowType = 'Must' | 'Should' | 'Could' | 'Wont'

export interface Feature {
  id: string
  title: string
  description: string
  status: FeatureStatus
  priority: FeaturePriority
  reach: number
  impact: number
  confidence: number
  effort: number
  riceScore: number
  moscow: MoscowType
  assignee: string
  dueDate: string
  linkedDocId: string | null
}

export type AIWorkflow =
  | 'prd'
  | 'stories'
  | 'roadmap'
  | 'prioritization'
  | 'research'
  | 'data'
  | 'general'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  workflow: AIWorkflow
}

export interface ResearchInsight {
  id: string
  theme: string
  summary: string
  quotes: string[]
  frequency: number
  linkedFeatures: string[]
}

export type Theme = 'dark' | 'light'
export type SaveStatus = 'idle' | 'saving' | 'saved'

export interface Workspace {
  documents: Document[]
  features: Feature[]
  messages: AIMessage[]
  insights: ResearchInsight[]
  activeDocId: string | null
  activeSidebarTab: string
  theme: Theme
  saveStatus: SaveStatus
}
