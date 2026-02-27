# Future Feature Note: Custom Vocabulary Books

## Can this project support custom books later?

Yes. The current architecture (React + Supabase + `words` + `progress`) is a good base for adding user-created vocabulary books without a major rewrite.

## Recommended database design

Add new tables:

1. `books`
- `id`
- `owner_user_id` (nullable for system/public books)
- `title`
- `description`
- `visibility` (`private` / `public`)
- `created_at`

2. `book_words` (many-to-many mapping)
- `book_id`
- `word_id`
- optional `position`

3. `user_selected_books`
- `user_id`
- `book_id`

## Why this design works

- Keep `words` as the single source of truth.
- A "book" is only a collection of existing `word_id`s.
- Existing study flow can be reused by changing query filters from level-only to book-based selection.

## Frontend changes needed

- Add a book selector in `/study`.
- Keep existing JLPT level filters as default system books.
- Add a "Create Book" flow:
  - create/edit book metadata
  - search words
  - add/remove words from the book

## Backend / RLS considerations

- Users can create/update/delete only their own books.
- Public/system books can be read by all users.
- `book_words` follows book ownership/visibility.

## Progress model options

Current progress key is `user_id + word_id`.

- Simple option (recommended first): keep as-is.
  - If a word appears in multiple books, progress is shared.
- Advanced option (later): track per-book progress.
  - Add `book_id` to progress key.

## Safe migration path

1. Add `books` and `book_words` tables.
2. Seed JLPT default books from existing level data.
3. Add frontend selector for books.
4. Add user custom-book CRUD.
5. Optional: upgrade to per-book progress if needed.

## Suggested implementation phases

- Phase 1: schema + seed default books
- Phase 2: study query supports selected books
- Phase 3: custom book management UI
- Phase 4: optional per-book progress model
