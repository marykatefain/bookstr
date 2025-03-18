
interface NostrWindow {
  getPublicKey(): Promise<string>;
  signEvent(event: any): Promise<any>;
}

declare global {
  interface Window {
    nostr?: NostrWindow;
  }
}

export {};
