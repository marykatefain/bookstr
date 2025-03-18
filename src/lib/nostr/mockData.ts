
import { SocialActivity } from "./types";
import { mockBooks } from "./types";

export const mockAuthors = [
  {
    pubkey: "pubkey1",
    name: "Alice Reader",
    picture: "https://i.pravatar.cc/150?img=1"
  },
  {
    pubkey: "pubkey2",
    name: "Bob Bookworm",
    picture: "https://i.pravatar.cc/150?img=2"
  },
  {
    pubkey: "pubkey3",
    name: "Charlie Librarian",
    picture: "https://i.pravatar.cc/150?img=3"
  },
  {
    pubkey: "pubkey4",
    name: "Diana Writer",
    picture: "https://i.pravatar.cc/150?img=4"
  },
  {
    pubkey: "pubkey5",
    name: "Evan Critic",
    picture: "https://i.pravatar.cc/150?img=5"
  },
  {
    pubkey: "pubkey6",
    name: "Fiona Publisher",
    picture: "https://i.pravatar.cc/150?img=6"
  }
];

export const mockActivities: SocialActivity[] = [
  {
    id: "activity1",
    pubkey: "pubkey1",
    type: "review",
    book: mockBooks[0],
    content: "An absolute masterpiece! The world-building is incredible and the characters feel so real. I couldn't put it down and read it in one sitting.",
    rating: 5,
    createdAt: Date.now() - 3600000, // 1 hour ago
    author: {
      name: "Alice Reader",
      picture: "https://i.pravatar.cc/150?img=1"
    },
    reactions: {
      count: 12,
      userReacted: false
    }
  },
  {
    id: "activity2",
    pubkey: "pubkey2",
    type: "tbr",
    book: mockBooks[1],
    createdAt: Date.now() - 7200000, // 2 hours ago
    author: {
      name: "Bob Bookworm",
      picture: "https://i.pravatar.cc/150?img=2"
    },
    reactions: {
      count: 5,
      userReacted: true
    }
  },
  {
    id: "activity3",
    pubkey: "pubkey3",
    type: "reading",
    book: mockBooks[2],
    createdAt: Date.now() - 86400000, // 1 day ago
    author: {
      name: "Charlie Librarian",
      picture: "https://i.pravatar.cc/150?img=3"
    },
    reactions: {
      count: 8,
      userReacted: false
    }
  },
  {
    id: "activity4",
    pubkey: "pubkey4",
    type: "finished",
    book: mockBooks[3],
    createdAt: Date.now() - 172800000, // 2 days ago
    author: {
      name: "Diana Writer",
      picture: "https://i.pravatar.cc/150?img=4"
    },
    reactions: {
      count: 15,
      userReacted: false
    }
  },
  {
    id: "activity5",
    pubkey: "pubkey5",
    type: "rating",
    book: mockBooks[4],
    rating: 4,
    createdAt: Date.now() - 259200000, // 3 days ago
    author: {
      name: "Evan Critic",
      picture: "https://i.pravatar.cc/150?img=5"
    },
    reactions: {
      count: 3,
      userReacted: false
    }
  },
  {
    id: "activity6",
    pubkey: "pubkey1",
    type: "review",
    book: mockBooks[5],
    content: "I found this classic to be a bit overrated. While the prose is beautiful, the pacing was too slow for my taste.",
    rating: 3,
    createdAt: Date.now() - 345600000, // 4 days ago
    author: {
      name: "Alice Reader",
      picture: "https://i.pravatar.cc/150?img=1"
    },
    reactions: {
      count: 7,
      userReacted: true
    }
  },
  {
    id: "activity7",
    pubkey: "pubkey6",
    type: "reading",
    book: mockBooks[6],
    createdAt: Date.now() - 432000000, // 5 days ago
    author: {
      name: "Fiona Publisher",
      picture: "https://i.pravatar.cc/150?img=6"
    },
    reactions: {
      count: 9,
      userReacted: false
    }
  },
  {
    id: "activity8",
    pubkey: "pubkey2",
    type: "finished",
    book: mockBooks[7],
    createdAt: Date.now() - 518400000, // 6 days ago
    author: {
      name: "Bob Bookworm",
      picture: "https://i.pravatar.cc/150?img=2"
    },
    reactions: {
      count: 11,
      userReacted: false
    }
  },
  {
    id: "activity9",
    pubkey: "pubkey3",
    type: "review",
    book: mockBooks[8],
    content: "A masterpiece of historical fiction! Tolstoy's character development is unmatched. This book changed how I think about literature and history.",
    rating: 5,
    createdAt: Date.now() - 604800000, // 7 days ago
    author: {
      name: "Charlie Librarian",
      picture: "https://i.pravatar.cc/150?img=3"
    },
    reactions: {
      count: 18,
      userReacted: false
    }
  },
  {
    id: "activity10",
    pubkey: "pubkey4",
    type: "tbr",
    book: mockBooks[9],
    createdAt: Date.now() - 691200000, // 8 days ago
    author: {
      name: "Diana Writer",
      picture: "https://i.pravatar.cc/150?img=4"
    },
    reactions: {
      count: 2,
      userReacted: false
    }
  }
];

// Mock followers' activities (subset of global activities)
export const mockFollowersActivities: SocialActivity[] = [
  mockActivities[0],
  mockActivities[2],
  mockActivities[5],
  mockActivities[7]
];

// Mock global activities (all activities)
export const mockGlobalActivities: SocialActivity[] = [...mockActivities];
