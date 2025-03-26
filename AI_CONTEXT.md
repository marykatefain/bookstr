
# Bookstr – A Social Book Tracking App Built on Nostr

**Project Description:**  
Bookstr Nostr is a web app that uses the decentralized social protocol Nostr to allow users to track their reading lists, discover new books, and engage with the reading community. 

## Table of Contents

- [1. Architecture Overview](#1-architecture-overview)
  - [Core Components](#core-components)
  - [Key Modules](#key-modules)
  - [Data Flow](#data-flow)
  - [Caching Strategy](#caching-strategy)
  - [Error Handling](#error-handling)
  - [Security Considerations](#security-considerations)
- [2. Book Look Up with Open Library API](#2-book-look-up-with-open-library-api)
  - [Open Library Search API](#open-library-search-api)
  - [ISBN API](#isbn-api)
  - [Book Cover API](#book-cover-api)
  - [Rate Limiting](#rate-limiting)
- [3. User Engagement with Book Tracking, Rating, Reviewing, and more - over Nostr](#3-user-engagement-with-book-tracking-rating-reviewing-and-more---over-nostr)
  - [Nostr Events and Relays](#nostr-events-and-relays)
  - [Updating Book Lists: Kinds `10075`, `10074`, and `10073`](#updating-book-lists-kinds-10075-10074-and-10073)
  - [Ratings and Reviews: Kind 31985](#ratings-and-reviews-kind-31985)
  - [Posts, replies, and reactions](#posts-replies-and-reactions)
- [4. AI Tips](#4-ai-tips)
- [5. UI Component Organization](#5-ui-component-organization)
- [6. Social Feed Implementation](#6-social-feed-implementation)
- [7. Error & Loading States](#7-error--loading-states)
- [8. Performance Optimization](#8-performance-optimization)

---

## 1. Architecture Overview

**Bookstr Architecture**

Bookstr is a React-based web application that leverages the decentralized Nostr protocol for social features and the Open Library API for book data. Here's a breakdown of the system architecture:

### Core Components

1. **Frontend Framework**
   - React + TypeScript for the UI layer
   - React Router for navigation and routing
   - TanStack Query for data fetching, caching, and state management
   - Tailwind CSS + Shadcn UI for styling

2. **Data Sources**
   - Nostr Relays: Primary data store for user-generated content (reviews, reading lists, posts)
   - Open Library API: External API for book metadata and search functionality
   - Browser LocalStorage: Persistent storage for user session, relay preferences

### Key Modules

1. **Nostr Module** (`/src/lib/nostr/`)
   - `user.ts`: Handles user authentication and profile management
   - `publish.ts`: Manages event creation and publishing to relays
   - `fetch/`: Collection of specialized fetching utilities for different data types
   - `relay/`: Connection management and communication with Nostr relays
   - `types/`: TypeScript definitions for Nostr-related data structures

2. **Open Library Module** (`/src/lib/openlibrary/`)
   - `search.ts`: Book search functionality
   - `bookDetails.ts`: Retrieving detailed book information
   - `trending.ts`: Fetching trending/popular books
   - `genres.ts`: Genre-based book discovery
   - Local caching layer to reduce API calls and rate limiting issues

3. **UI Components** (`/src/components/`)
   - Layout components for page structure
   - Reusable UI elements (cards, buttons, etc.)
   - Feature-specific components organized by domain (book, social, user)
   - Shadcn UI components for consistent design

4. **Pages** (`/src/pages/`)
   - Container components that compose the application's main views
   - Integration of data fetching, state management, and UI components

5. **Hooks** (`/src/hooks/`)
   - Custom React hooks for reusable logic and data access
   - Feature-specific hooks that abstract complex operations

### Data Flow

1. **Book Data**
   - User initiates search or selects a book
   - App checks local cache for existing data
   - If not found, request is made to Open Library API via Cloudflare proxy
   - Data is parsed, normalized, and stored in cache
   - UI components consume and display the data

2. **User-Generated Content**
   - User creates content (review, post, list update)
   - Content is formatted as a Nostr event with appropriate tags
   - Event is signed using the user's Nostr extension
   - Signed event is published to multiple relays
   - On success, UI updates optimistically

3. **Content Retrieval**
   - App connects to configured Nostr relays
   - Sends filtered subscription requests based on content type
   - Processes incoming events, deduplicates them
   - For book-related events, enhances data with Open Library information
   - Updates UI with the combined data

4. **Social Interactions**
   - Follows same pattern as content creation
   - Special event types for reactions, replies, follows
   - UI updates optimistically while publishing occurs in background

### Caching Strategy

1. **In-Memory Cache**
   - TanStack Query provides request-level caching
   - Custom cache implementations for frequent operations

2. **Local Storage**
   - User profile and authentication state
   - Relay configurations and preferences

3. **API Response Caching**
   - Cloudflare proxy for Open Library API requests
   - Local caching with TTL for book metadata

### Error Handling

1. **API Failures**
   - Fallback to cached data when possible
   - Graceful degradation with placeholder content
   - Retry mechanisms with exponential backoff

2. **Network Issues**
   - Detection of relay connection problems
   - Automatic reconnection attempts
   - User feedback through toast notifications

### Security Considerations

1. **Authentication**
   - Leverages Nostr protocol's public key cryptography
   - No server-side sessions or tokens to manage
   - Client-side signature verification

2. **Data Integrity**
   - Verification of event signatures
   - Deduplication of events from multiple relays
   - Validation of data structures before rendering

---

## 2. Book Look Up with Open Library API
Using Open Library API, users can search for books. ISBN is the source of truth for each book, and we need the ISBN to make everything work, so it important to prioritize fetching that. 

Open Library lookup data is being cached via cloudflare at `https://bookstr.xyz/api/openlibrary`

Open Library has several APIs for accessing Book data.

- The Search API- The Works API (by Work ID)
- The Editions API (by Edition ID)
- The ISBN API (by ISBN)
- The Books API (generic)

### Open Library Search Api

The Open Library Search API is one of the most convenient and complete ways to retrieve book data on Open Library. The API:

- Is able to return data for multiple books in a single request/response
- Returns both Work level information about the book (like author info, first publish year, etc), as well as Edition level information (like title, identifiers, covers, etc)
- Author IDs are returned which you can use to fetch the author's image, if available
- Options are available to return Book Availability along with the response.
- Powerful sorting options are available, such as star ratings, publication date, and number of editions.

**Examples**

The URL format for API is simple. Take the search URL and add .json to the end. Eg:

- https://openlibrary.org/search.json?q=the+lord+of+the+rings
- https://openlibrary.org/search.json?title=the+lord+of+the+rings
- https://openlibrary.org/search.json?author=tolkien&sort=new
- https://openlibrary.org/search.json?q=the+lord+of+the+rings&page=2
- https://openlibrary.org/search/authors.json?q=twain

Using Thing IDs to get Images

You can use the olid (Open Library ID) for authors and books to fetch covers by olid, e.g.: https://covers.openlibrary.org/a/olid/OL23919A-M.jpg

**URL Parameters**

- `q`	The solr query. See Search HowTo for sample queries
- `fields`	The fields to get back from solr. Use the special value * to get all fields (although be prepared for a very large response!).
To fetch availability data from archive.org, add the special value, availability. Example: /search.json?q=harry%20potter&fields=*,availability&limit=1. This will fetch the availability data of the first item in the `ia` field.
sort	You can sort the results by various facets such as new, old, random, or key (which sorts as a string, not as the number stored in the string). For a complete list of sorts facets look here (this link goes to a specific commit, be sure to look at the latest one for changes). The default is to sort by relevance.
- `lang`	The users language as a two letter (ISO 639-1) language code. This influences but doesn't exclude search results. For example setting this to fr will prefer/display the French edition of a given work, but will still match works that don't have French editions. Adding language:fre on the other hand to the search query will exclude results that don't have a French edition.
- `offset / limit`	Use for pagination.
- `page / limit`	Use for pagination, with limit corresponding to the page size. Note page starts at 1.

**Response Format**

The response will be of the following format.

```
{
    "start": 0,
    "num_found": 629,
    "docs": [
        {...},
        {...},
        ...
        {...}]
}
```

Each document specified listed in "docs" will be of the following format:


```
{
    "cover_i": 258027,
    "has_fulltext": true,
    "edition_count": 120,
    "title": "The Lord of the Rings",
    "author_name": [
        "J. R. R. Tolkien"
    ],
    "first_publish_year": 1954,
    "key": "OL27448W",
    "ia": [
        "returnofking00tolk_1",
        "lordofrings00tolk_1",
        "lordofrings00tolk_0",
    ],
    "author_key": [
        "OL26320A"
    ],
    "public_scan_b": true
}
```

The fields in the doc are described by Solr schema which can be found here:
https://github.com/internetarchive/openlibrary/blob/b4afa14b0981ae1785c26c71908af99b879fa975/openlibrary/plugins/worksearch/schemes/works.py#L38-L91

The schema is not guaranteed to be stable, but most common fields (e.g. title, IA ids, etc) should be safe to depend on.

**Getting edition information**

By default, the search endpoint returns works instead of editions. A work is a collection of editions; for example there is only one work for The Wonderful Wizard of Oz (OL18417W), but there are 1029 editions, over many languages! Sometimes you might want to fetch data about editions as well as works. That is what the editions field is for: https://openlibrary.org/search.json?q=crime+and+punishment&fields=key,title,author_name,editions

```
{
    "numFound": 2421,
    "start": 0,
    "numFoundExact": true,
    "docs": [
        {
            "key": "/works/OL166894W",
            "title": "Преступление и наказание",
            "author_name": ["Фёдор Михайлович Достоевский"],
            "editions": {
                "numFound": 290,
                "start": 0,
                "numFoundExact": true,
                "docs": [
                    {
                        "key": "/books/OL37239326M",
                        "title": "Crime and Punishment"
                    }
                ]
            }
        },
    ...
```

The editions sub-object contains the editions of this work that match the user's query (here, "crime and punishment"), sorted so the best (i.e. most relevant) is at the top. Matching editions are first selected by forwarding any search fields in the query that apply to editions (e.g. publisher, language, ebook_access, has_fulltext, etc). Any un-fielded search terms (e.g. "crime and punishment", above) are also applied, but are not require to all match.

From these, relevance is further determined by boosting books that (1) match the user's language, (2) are readable, (3) have a cover.

You can see this in action in the search UI as well. Consider the following searches:

"sherlock holmes" - The first work is OL262463W, with the edition displayed Memoirs of Sherlock Holmes (OL7058607M). This edition was selected because it matched the user's query, and it matched the user's language (my language is English), and because it was readable.
"sherlock holmes language:fre" - The same work is displayed as above, but now the displayed edition is Souvenirs sur Sherlock Holmes (OL8887270M), selected because the user's query requires a book in French.
"sherlock holmes" for a French user - By setting lang=fr in the URL, we can simulate the website as it would appear for a French user. This information is used to influence the results again, and the displayed edition is Souvenirs sur Sherlock Holmes (OL8887270M) since this matches the user's language.
"souvenirs sur sherlock holmes" - Here as an English user, I search by the French title. So again I will see the same work as always, but the displayed edition will now also be Souvenirs sur Sherlock Holmes (OL8887270M) since this best matches the user's query.
In the API, you can also fetch fields from editions separately from those on the work, like so:

https://openlibrary.org/search.json?q=crime+and+punishment&fields=key,title,author_name,editions,editions.key,editions.title,editions.ebook_access,editions.language

```
{
    "numFound": 2421,
    "start": 0,
    "numFoundExact": true,
    "docs": [
        {
            "key": "/works/OL166894W",
            "title": "Преступление и наказание",
            "author_name": ["Фёдор Михайлович Достоевский"],
            "editions": {
                "numFound": 290,
                "start": 0,
                "numFoundExact": true,
                "docs": [
                    {
                        "key": "/books/OL37239326M",
                        "title": "Crime and Punishment",
                        "language": [
                            "eng"
                        ],
                        "ebook_access": "public"
                    }
                ]
            }
        },
    ...
```


### ISBN API
The ISBN API is a special case and alternative approach to arriving at an Editions page. Instead of "/books", a path of "/isbn" is used, followed by a valid ISBN 10 or 13.

Here is an example: https://openlibrary.org/isbn/9780140328721

In this example, entering this URL will result in a redirect to the appropriate Editions page: https://openlibrary.org/books/OL7353617M

Just like an Edition or Work page, we may add ".json" to the end of the URL to request the response in json instead of as HTML, e.g.: https://openlibrary.org/isbn/9780140328721.json

### Book Cover API
Book covers can be accessed using Cover ID (internal cover ID), OLID (Open Library ID), ISBN, OCLC, and LCCN.

The covers are available in 3 sizes:
- S: Small, suitable for use as a thumbnail on a lists section of a work on Open Library,
- M: Medium, suitable for display on a details page on Open Library and,
- L: Large

The URL pattern to access book covers is:

https://covers.openlibrary.org/b/$key/$value-$size.jpg

Where:
- key can be any one of ISBN, OCLC, LCCN, OLID and ID (case-insensitive)
- value is the value of the chosen key
- size can be one of S, M and L for small, medium and large respectively.
- By default it returns a blank image if the cover cannot be found. If you append ?default=false to the end of the URL, then it returns a 404 instead.

The following example returns small sized cover image for book with ISBN 0385472579.

https://covers.openlibrary.org/b/isbn/0385472579-S.jpg

The same cover can be accessed in multiple ways using different keys:

- https://covers.openlibrary.org/b/id/240727-S.jpg
- https://covers.openlibrary.org/b/olid/OL7440033M-S.jpg
- https://covers.openlibrary.org/b/isbn/0385472579-S.jpg
- https://covers.openlibrary.org/b/isbn/9780385472579-S.jpg
- https://covers.openlibrary.org/b/lccn/93005405-S.jpg
- https://covers.openlibrary.org/b/oclc/28419896-S.jpg

**Author Photos**
Author photos can be accessed using OLID and ID.

The URL Pattern for accessing author photos is: https://covers.openlibrary.org/a/$key/$value-$size.jpg

For example the following is the photograph of Donald E. Knuth from the Open Library: https://covers.openlibrary.org/a/olid/OL229501A-S.jpg
 
**Cover Size & API Access**
You can add .json to end end of cover urls to return API information about the cover, e.g. https://covers.openlibrary.org/b/id/12547191.json.

One can fetch the image off-screen and use it's width/height:

```
async function fetchImage(url) {
    const img = new Image();
    return new Promise((res, rej) => {
        img.onload = () => res(img);
        img.onerror = e => rej(e);
        img.src = url;
    });
}
const img = await fetchImage('https://covers.openlibrary.org/b/id/12547191-L.jpg');
const w = img.width;
const h = img.height
```

This one way one won't need to make two separate requests per image! The browser won't make a second request for the image if you set the src of your visible <img> element after fetching it in this way.

### Rate Limiting
The cover access by ids other than CoverID and OLID are rate-limited. Currently only 100 requests/IP are allowed for every 5 minutes.

If any IP tries to access more that the allowed limit, the service will return "403 Forbidden" status.

Always use the Bookstr cloudflare cache for requests when possibleto avoid getting rate limited: `https://bookstr.xyz/api/openlibrary`, the project also supports local caching.

The full docs of the Open Library API can he found [here](https://openlibrary.org/developers/api).

---

## 3. User Engagement with Book Tracking, Rating, Reviewing, and more - over Nostr

### Nostr Events and Relays

The user's actions on books are stored as Nostr events, which are then published and read from Nostr relays. Here are a few Nostr relays: 

- wss://ditto.pub/relay: my default relay
- wss://relay.nostr.band: good for account lookup
- wss://relay.damus.io: good general purpose relay

The Nostr protocol is standardized with NIPS, the documentation of which can be found [here](https://github.com/nostr-protocol/nips)

### Updating Book Lists: Kinds `10075`, `10074`, and `10073`

These are new event kinds created specifically for Bookstr. They are replacable lists which should be fully updated with each action to either add or remove the respective books isbn from the list. 

- k tag = "isbn"
- i tags = isbns all books on the new version of the list (with new book either added or removed as needed)
- Kind 10075: To Be Read list (TBR)
- Kind 10074: Currently Reading List
- Kind 10073: Read (Finished) List 

Example Event for "Add to TBR" :
```
{
  "kind": 10075,
  "created_at": 1743013293,
  "tags": [
    ["k", "isbn"],
    ["i","isbn:0062362712"],
    ["i","isbn:9783641283452"],
    ["i","isbn:9780008710224"
    ]
  ],
  "content": "",
  "pubkey": "932614571afcbad4d17a191ee281e39eebbb41b93fac8fd87829622aeb112f4d"
}
```
See [NIP 51](https://github.com/nostr-protocol/nips/blob/master/51.md) for general information on user-created lists. 


### Ratings and Reviews: Kind 31985

**For ratings/reviews Bookstr uses Kind 31985, a new proposed event kind.** 

- Kind `31985`
- `d` tag = the isbn of the book being reviewed
- `k` tag = "isbn"
- `rating` = a number on the scale of 0-1

Please note that here the review uses d tags instead of i tags for ISBN (versus in the other event kinds). This is a common point of error, so pay attention to get it right!

Please also note that although the Bookstr UI displays ratings on a scale of 1-5 stars, the underlying data model is a scale of 0-1. So all ratings must be numerically converted before displaying in the UI. Here is a basic conversion chart: 

- raw rating .20 -> 1 star
- raw rating .40 -> 2 stars
- raw rating .60 -> 3 stars
- raw rating .80 -> 4 stars
- raw rating 1 -> 5 stars

The raw rating of 1 -> 5 stars is a common point of error, as well, because 1 (without context) could also be 1 star. This is why it's always important to double check if you are using raw or converted rating data before displaying it in the UI. 

Example Review event: 

```
{
  "kind": 31985,
  "created_at": 1743013662,
  "tags": [
    ["d","isbn:9781619634466"],
    ["k","isbn"],
    ["rating",".8"
    ]
  ],
  "content": "Great book!",
  "pubkey": "932614571afcbad4d17a191ee281e39eebbb41b93fac8fd87829622aeb112f4d"
}
```
See [NIP 73](https://github.com/nostr-protocol/nips/blob/master/73.md) for basic information about External Content IDs ex. i tag for isbn)


### Posts, replies, and reactions

**For user profiles, posts, replies, and reactions we use regular Nostr event Kinds 0, 1, 7, and 1111**

- See [NIP 01](https://github.com/nostr-protocol/nips/blob/master/01.md) for user profiles (Kind 0) and Nostr basics
- See [NIP 10](https://github.com/nostr-protocol/nips/blob/master/10.md) for Kind 1 text notes and replies
- See [NIP 25](https://github.com/nostr-protocol/nips/blob/master/25.md) for Kind 7 reactions
- See [NIP 22](https://github.com/nostr-protocol/nips/blob/master/22.md) for Kind 1111 comments to events that are not Kind 1 (ex. for comments on book reviews)  

Example Post that includes a book reference (i tag with isbn) and #bookstr (t tag): 

```
{
  "kind": 1,
  "created_at": 1743015053,
  "tags": [
    ["i", "isbn:9781649374189"],
    ["t", "bookstr"],
    ["k","isbn"]
  ],
  "content": "I've been procrastinating reading Onyx Storm... is it good? #bookstr",
  "pubkey": "932614571afcbad4d17a191ee281e39eebbb41b93fac8fd87829622aeb112f4d"
}
```

---

## 4. AI Tips

- Use `/src/lib/nostr/` for anything Nostr-related.
- Use `/src/lib/openlibrary/` for book data functions.
- Book ISBN is always the **source of truth** – all user actions on books should use ISBN.
- Ratings are **0–1 float**, not 1–5 stars. Always normalize or denormalize accordingly.
- All book list updates must **overwrite the full list** (replacable events per NIP-51).

Do NOT:
- Create server-based auth — we use Nostr signatures only.
- Store user data server-side — use localStorage or Nostr events.
- Mix up the `d` and `i` tags for ISBNs - they're used in different contexts.
- Implement direct API calls to OpenLibrary without using the caching proxy.

---

## 5. UI Component Organization

### Component Structure
- **UI Components** (`/src/components/ui/`): Reusable generic UI elements like buttons, cards, etc.
- **Feature Components** (`/src/components/{feature}/`): Components specific to features (books, social, profile)
- **Page Components** (`/src/pages/`): Top-level components that represent entire pages
- **Layout Components** (`/src/components/layout/`): Components for page structure and navigation

### Component Best Practices
- Keep components focused on a single responsibility
- Split complex components into smaller subcomponents
- Use composition over inheritance
- Maintain consistent naming conventions across similar components
- Prefer functional components with hooks over class components

### Shadcn UI Integration
- Use Shadcn UI components as the foundation for the UI
- Customize Shadcn components using Tailwind classes through the `cn` utility
- Follow the established pattern of creating wrapper components around Shadcn components
- Import components from their correct locations (e.g., toast components from hooks/use-toast)

---

## 6. Social Feed Implementation

### Feed Architecture
- Social feeds are split between following feed and global feed
- Each feed has its own data fetching strategy and refresh mechanism
- Feed components are separated from feed data fetching logic

### Feed Components
- Use `FeedLoadingState` for loading states
- Use `FeedErrorState` for error states
- Use `EmptyFeedState` for empty states
- Feed items are displayed through `ActivityCard` or `PostCard` components

### Feed Data Flow
- Relay connections are managed in `nostr/relay/`
- Events are fetched, filtered, and processed by functions in `nostr/fetch/social/`
- Feed data is enriched with user profiles, reactions, and replies

### Refresh Strategies
- Manual refresh through UI actions
- Auto-refresh on specific intervals (different for global and following feeds)
- Background refresh to minimize UI interruptions

---

## 7. Error & Loading States

### Loading States
- Always implement Skeleton components during data loading
- Use consistent loading patterns across similar features
- Provide visual feedback for background operations

### Empty States
- Display informative empty states with actionable guidance
- Customize empty states based on context (e.g., empty search vs. empty feed)
- Provide clear next steps for users

### Error Handling
- Use toast notifications for transient errors
- Implement dedicated error state components for persistent errors
- Distinguish between connection issues and other types of errors
- Provide retry mechanisms where appropriate
- Log errors to console with contextual information

---

## 8. Performance Optimization

### Data Fetching
- Use TanStack Query for efficient data fetching and caching
- Implement proper cache invalidation strategies
- Use debouncing for input-triggered queries (e.g., search)

### Nostr Optimizations
- Use throttlePromises utility for controlling concurrency of relay operations
- Implement efficient event filters to minimize unnecessary data transfer
- Cache frequently accessed data locally

### Rendering Optimization
- Memoize expensive components with React.memo
- Use virtualization for long lists
- Implement proper dependency arrays in useEffect and useMemo hooks
- Split large components into smaller, focused ones

### Network Efficiency
- Batch related API requests where possible
- Use the CloudFlare proxy for OpenLibrary requests to avoid rate limiting
- Implement progressive loading for media content
