# Bookstr – A Social Book Tracking App Built on Nostr

**Project Description:**  
Bookstr Nostr is a web app that uses the decentralized social protocol Nostr to allow users to track their reading lists, discover new books, and engage with the reading community. 

**Tech Stack:**  
- Frontend: React + Tailwind + Vite  
- Data Sources: Nostr relays (ex. wss://ditto.pub/relay), Open Library API [(https://openlibrary.org/developers/api)](https://openlibrary.org/developers/api)

## Key Features

### Book Look Up with Open Library API
Using Open Library API, users can search for books. ISBN is the source of truth for each book, and we need the ISBN to make everything work, so it important to prioritize fetching that. 

Open Library lookup data is being cached via cloudflare at `https://bookstr.xyz/api/openlibrary`

Open Library has several APIs for accessing Book data.

- The Search API- The Works API (by Work ID)
- The Editions API (by Edition ID)
- The ISBN API (by ISBN)
- The Books API (generic)

**Open Library Search Api**

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


**ISBN API**
The ISBN API is a special case and alternative approach to arriving at an Editions page. Instead of "/books", a path of "/isbn" is used, followed by a valid ISBN 10 or 13.

Here is an example: https://openlibrary.org/isbn/9780140328721

In this example, entering this URL will result in a redirect to the appropriate Editions page: https://openlibrary.org/books/OL7353617M

Just like an Edition or Work page, we may add ".json" to the end of the URL to request the response in json instead of as HTML, e.g.: https://openlibrary.org/isbn/9780140328721.json

**Book Cover API**
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

**Rate Limiting**
The cover access by ids other than CoverID and OLID are rate-limited. Currently only 100 requests/IP are allowed for every 5 minutes.

If any IP tries to access more that the allowed limit, the service will return "403 Forbidden" status.

The full docs of the Open Library API can he found [here](https://openlibrary.org/developers/api).


### Book Reading Tracking


### Book Ratings & Reviews


### Social engagement

