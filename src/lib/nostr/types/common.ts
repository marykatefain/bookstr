
export interface NostrEventData {
  id?: string;
  pubkey?: string;
  created_at?: number;
  kind?: number;
  tags?: string[][];
  content?: string;
  sig?: string;
}

export type BookActionType = 'tbr' | 'reading' | 'finished';
