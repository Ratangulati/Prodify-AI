import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { getSystemPrompt } from '@/lib/prompts'
import type { AIWorkflow } from '@/lib/types'

export const runtime = 'edge'

const client = new Anthropic()

interface RequestBody {
  workflow: AIWorkflow
  userMessage: string
  documentContext?: string
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
}

export async function POST(req: NextRequest) {
  let body: RequestBody

  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const { workflow = 'general', userMessage, documentContext, conversationHistory = [] } = body

  if (!userMessage?.trim()) {
    return new Response('userMessage is required', { status: 400 })
  }

  const systemPrompt = getSystemPrompt(workflow, documentContext)

  // Build the full messages array: history + new user message
  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ]

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-5-20251001',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        controller.error(err)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
