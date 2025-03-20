
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

export interface Reply {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  author?: {
    name?: string;
    picture?: string;
    npub?: string;
  };
  parentId: string;
}
