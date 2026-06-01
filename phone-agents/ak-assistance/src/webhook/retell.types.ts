export type RetellCallStatus = "registered" | "ongoing" | "ended" | "error";

export interface RetellCallStartedEvent {
  event: "call_started";
  call_id: string;
  agent_id: string;
  call_type: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  start_timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface RetellCallEndedEvent {
  event: "call_ended";
  call_id: string;
  agent_id: string;
  from_number: string;
  to_number: string;
  start_timestamp: number;
  end_timestamp: number;
  duration_ms: number;
  call_cost?: number;
  transcript?: string;
  transcript_object?: TranscriptEntry[];
  recording_url?: string;
  call_summary?: string;
  metadata?: Record<string, unknown>;
}

export interface TranscriptEntry {
  role: "agent" | "user";
  content: string;
  words: { word: string; start: number; end: number }[];
}

export type RetellWebhookEvent = RetellCallStartedEvent | RetellCallEndedEvent;
