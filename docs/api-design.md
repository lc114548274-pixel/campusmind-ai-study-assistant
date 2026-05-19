# API 设计

## 认证

- `POST /api/auth/register`：注册用户
- `POST /api/auth/login`：登录并获取访问令牌
- `GET /api/auth/me`：获取当前用户信息

## 课程

- `GET /api/courses`：获取课程列表
- `POST /api/courses`：创建课程
- `GET /api/courses/{course_id}`：获取课程详情
- `PUT /api/courses/{course_id}`：更新课程
- `DELETE /api/courses/{course_id}`：删除课程

## 文档

- `POST /api/courses/{course_id}/documents/upload`：上传课程 PDF
- `GET /api/courses/{course_id}/documents`：获取课程文档列表
- `GET /api/documents/{document_id}`：获取文档详情
- `DELETE /api/documents/{document_id}`：删除文档

## AI 问答

- `POST /api/courses/{course_id}/chat`：基于课程资料提问
- `GET /api/courses/{course_id}/chat/sessions`：获取课程聊天会话
- `GET /api/chat/sessions/{session_id}`：获取指定聊天会话

## 总结

- `POST /api/documents/{document_id}/summary`：生成或重新生成文档总结
- `GET /api/documents/{document_id}/summary`：获取文档总结

## 复习题

- `POST /api/courses/{course_id}/quiz`：生成复习题
- `GET /api/courses/{course_id}/quiz`：获取复习题历史

## 术语翻译

- `POST /api/terms/translate`：提取并解释中 / 英 / 韩术语
