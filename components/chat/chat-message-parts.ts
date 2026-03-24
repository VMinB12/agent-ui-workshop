import type { FileUIPart, ReasoningUIPart, TextUIPart, UIMessage } from 'ai'

import type { ToolPart } from '@/components/ai-elements/tool'

const TOOL_STATES: ReadonlySet<ToolPart['state']> = new Set([
  'approval-requested',
  'approval-responded',
  'input-available',
  'input-streaming',
  'output-available',
  'output-denied',
  'output-error',
])

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

export const isTextPart = (part: unknown): part is TextUIPart =>
  isRecord(part) && part.type === 'text' && typeof part.text === 'string'

export const isReasoningPart = (part: unknown): part is ReasoningUIPart =>
  isRecord(part) && part.type === 'reasoning' && typeof part.text === 'string'

export const isFilePart = (part: unknown): part is FileUIPart =>
  isRecord(part) &&
  part.type === 'file' &&
  typeof part.mediaType === 'string' &&
  typeof part.url === 'string' &&
  (typeof part.filename === 'string' || typeof part.filename === 'undefined')

export const isToolPart = (part: unknown): part is ToolPart =>
  isRecord(part) &&
  typeof part.type === 'string' &&
  (part.type.startsWith('tool-') || part.type === 'dynamic-tool') &&
  typeof part.state === 'string' &&
  TOOL_STATES.has(part.state as ToolPart['state']) &&
  'input' in part &&
  'output' in part &&
  'errorText' in part

export const getMessageFileParts = (message: UIMessage): Array<FileUIPart & { id: string }> =>
  message.parts.filter(isFilePart).map((part, index) => ({ ...part, id: `${message.id}-file-${index}` }))

export const getMessageReasoningParts = (message: UIMessage) => message.parts.filter(isReasoningPart)

export const getMessageContentParts = (message: UIMessage) =>
  message.parts.filter((part) => !isFilePart(part) && !isReasoningPart(part))
