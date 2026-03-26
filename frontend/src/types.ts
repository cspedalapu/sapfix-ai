export type ModelId = "llama3.1:8b" | "gpt-4o-mini";

export interface ResolutionSource {
  title: string;
  system: string;
  origin: string;
  summary: string;
  confidence: string;
}

export interface ResolutionSections {
  businessContext: string;
  rootCause: string;
  steps: string[];
  prevention: string[];
}

export interface AssistantResult {
  answer: string;
  diagnosticLabel: string;
  sections: ResolutionSections;
  sources: ResolutionSource[];
  latencyMs: number;
  mode: "mock" | "api";
  model: ModelId;
  requestedModel?: string;
  generationModel?: string;
  generationLabel?: string;
  generationNote?: string;
}

export interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  timestamp: string;
  result?: AssistantResult;
  state?: "ready" | "error";
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  model: ModelId;
  messages: Message[];
}
