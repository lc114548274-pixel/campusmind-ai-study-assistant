# API Design

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Courses

- `GET /api/courses`
- `POST /api/courses`
- `GET /api/courses/{course_id}`
- `PUT /api/courses/{course_id}`
- `DELETE /api/courses/{course_id}`

## Documents

- `POST /api/courses/{course_id}/documents/upload`
- `GET /api/courses/{course_id}/documents`
- `GET /api/documents/{document_id}`
- `DELETE /api/documents/{document_id}`

## Chat

- `POST /api/courses/{course_id}/chat`
- `GET /api/courses/{course_id}/chat/sessions`
- `GET /api/chat/sessions/{session_id}`

## Summary

- `POST /api/documents/{document_id}/summary`
- `GET /api/documents/{document_id}/summary`

## Quiz

- `POST /api/courses/{course_id}/quiz`
- `GET /api/courses/{course_id}/quiz`

## Terms

- `POST /api/terms/translate`
