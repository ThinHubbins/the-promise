// lib/assistant/types.ts

export type AssistantRole = 'user' | 'assistant';

export interface AssistantMessage {
  role: AssistantRole;
  content: string;
}

export interface AssistantRequestBody {
  messages: AssistantMessage[];
}

export interface AssistantResponseBody {
  reply: string;
}