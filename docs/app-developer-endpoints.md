# App Developer Integration Guide

This guide covers public API endpoints for fetching category-wise data, implementing Latest/Trending sorting, recording views, and handling contact form submissions.

## Base URL
- Backend API base: `{{API_BASE_URL}}` (example: `https://api.vakyapro.com`)

## Authentication
- Most endpoints below are public. Reels interactions and view events require user auth (Sanctum) where specified.

## Categories
- Learn categories
  - GET `/api/learn/categories`
  - Response:
    ```json
    { "data": [ { "name": "Photography", "count": 12 }, { "name": "Design", "count": 7 } ] }
    ```
- Pre-prompts (Feeds) categories
  - GET `/api/pre-prompts/categories`
  - Response:
    ```json
    { "data": [ { "name": "Portraits", "count": 20 }, { "name": "Cinematic", "count": 8 } ] }
    ```

## Feeds (Pre-prompts)
- List
  - GET `/api/pre-prompts?category={CategoryName}`
  - Query params:
    - `category` (optional): filter by category
  - Response:
    ```json
    { "data": [ { "id": 1, "title": "Professional Studio Headshot", "category": "Portraits", "sort_order": 1, "variants": [ { "prompt": "...", "image": "https://..." } ] } ] }
    ```

## Learns
- List
  - GET `/api/learn?category={CategoryName}&sort={latest|trending}`
  - Query params:
    - `category` (optional): filter by category
    - `sort` (optional): `latest` (default) or `trending`
  - Sorting logic:
    - `latest`: `created_at desc`, then `sort_order`, then `id`
    - `trending`: `views_count desc`, then `watch_time_ms desc`, then `created_at desc`
  - Response:
    ```json
    { "success": true, "data": [ { "id": 10, "title": "Lighting Basics", "category": "Photography", "video_url": "https://...", "thumbnail_url": "https://...", "duration": "3:12", "views_count": 124, "watch_time_ms": 456000, "created_at": "2026-03-16T10:12:00Z" } ] }
    ```
- Record view (requires auth)
  - POST `/api/learn/{id}/view`
  - Body:
    ```json
    { "watch_duration_ms": 120000, "is_completed": true }
    ```
  - Response:
    ```json
    { "views_count": 125, "watch_time_ms": 576000 }
    ```

## Reels (Video Feed)
- List
  - GET `/api/reels?sort={latest|trending}`
  - Query params:
    - `sort` (optional): `latest` (default) or `trending`
  - Sorting logic:
    - `latest`: `order asc`, then `created_at desc`
    - `trending`: `views_count desc`, then `likes_count desc`, then `shares_count desc`, then `created_at desc`
  - Response (requires auth):
    ```json
    { "data": [ { "id": 5, "title": "Studio Loop", "video_url": "https://...", "thumbnail_url": "https://...", "views_count": 204, "likes_count": 31, "saves_count": 7, "shares_count": 3, "comments_count": 2, "is_liked": false, "is_saved": true, "is_shared": false, "created_at": "2026-03-16T12:22:00Z" } ] }
    ```
- Interactions (require auth)
  - Like: POST `/api/reels/{id}/like`
  - Save: POST `/api/reels/{id}/save`
  - Share: POST `/api/reels/{id}/share`
  - View: POST `/api/reels/{id}/view` with body:
    ```json
    { "watch_duration_ms": 90000, "is_completed": false }
    ```

## Contact Us
- Submit form (public)
  - POST `/api/contact`
  - Body:
    ```json
    { "name": "User Name", "email": "user@example.com", "subject": "Support", "message": "Help needed..." }
    ```
  - Response:
    ```json
    { "id": 123, "message": "Thank you! Your message has been sent." }
    ```
  - Behavior:
    - Saves record to `contact_messages` table
    - Sends confirmation email to user and notification to admin
    - Admin email is configured via `CONTACT_NOTIFY_EMAIL` or `mail.from.address`

## Error Handling
- 4xx: Validation or not found
- 5xx: Server errors
- AI endpoints (`/api/ai/chat`, `/api/ai/chat/stream`):
  - If OpenAI key misconfigured or unreachable, returns `503` with `{ "message": "AI request failed" }`
  - Admin can verify OpenAI key under Settings → API Keys (Test API Key)

## Notes
- Use `Authorization: Bearer {token}` for endpoints requiring auth (views, reels interactions).
- Trending relies on view/like/share events; ensure your app posts view events with reasonable `watch_duration_ms`.
*** End Patch```}...
