# Collaborative Boards

A real-time collaborative boards application built with Node.js, TypeScript, React, and PostgreSQL. Features boards with lists and cards, real-time collaboration via Socket.IO, role-based access control, and full-text search.

## Features

- **Authentication & Authorization**: JWT-based auth with email verification, refresh tokens, and RBAC (Admin/Member/Commenter/Viewer)
- **Real-time Collaboration**: Socket.IO-powered real-time updates for card moves, edits, and comments
- **Boards Management**: Create and manage boards with multiple lists and cards
- **Card Management**: Full CRUD operations on cards with labels, assignees, due dates, descriptions, and attachments
- **Search & Filtering**: Full-text search with filters by labels, assignee, due date, and board/list
- **Notifications**: In-app notifications for mentions, assignments, and comments
- **File Uploads**: Local file storage for card attachments
- **Caching**: Redis-based caching for improved performance
- **Rate Limiting**: Request rate limiting for auth endpoints
- **Validation**: Comprehensive input validation with Zod schemas
- **Logging**: Structured JSON logging with Pino
- **Docker**: Full containerization with docker-compose

## Tech Stack

### Backend
- **Framework**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with argon2 password hashing
- **Real-time**: Socket.IO
- **Validation**: Zod
- **Caching**: Redis
- **File Upload**: Multer
- **Rate Limiting**: express-rate-limit
- **Logging**: Pino

### Frontend
- **Framework**: React + TypeScript + Vite
- **Routing**: React Router
- **Real-time**: Socket.IO client
- **Styling**: Styled Components
- **Markdown**: React Markdown
- **Drag & Drop**: React Beautiful DnD

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint + Prettier

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Running with Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd collaborative-boards
```

2. Start all services:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- API: http://localhost:4000
- Admin credentials: `admin@example.com` / `AdminPass123!`

### Local Development

1. Start the backend:
```bash
cd backend
npm install
cp env.example .env  # Configure your environment variables
npm run db:migrate
npm run db:seed
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "verified": false
  },
  "verificationToken": "token-here"
}
```

#### POST /api/auth/verify
Verify email with token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "token": "verification-token"
}
```

#### POST /api/auth/login
Authenticate user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST /api/auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

### Board Endpoints

#### POST /api/boards
Create a new board.

**Request Body:**
```json
{
  "title": "My Project Board"
}
```

#### GET /api/boards/:id
Get board with all lists and cards.

#### PATCH /api/boards/:id
Update board title.

**Request Body:**
```json
{
  "title": "Updated Board Title"
}
```

#### POST /api/boards/:id/members
Add member to board.

**Request Body:**
```json
{
  "email": "member@example.com",
  "role": "MEMBER"
}
```

### List Endpoints

#### POST /api/boards/:boardId/lists
Create a new list.

**Request Body:**
```json
{
  "title": "To Do",
  "position": 0
}
```

### Card Endpoints

#### POST /api/lists/:listId/cards
Create a new card.

**Request Body:**
```json
{
  "title": "Implement feature",
  "description": "Add the new feature to the application",
  "labels": ["feature", "frontend"],
  "assigneeId": "user-id",
  "dueDate": "2024-01-15T10:00:00Z"
}
```

#### PATCH /api/cards/:id
Update card.

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "labels": ["bug", "urgent"]
}
```

#### GET /api/cards/search
Search cards with filters.

**Query Parameters:**
- `query`: Search text
- `labels`: Comma-separated labels
- `assignee`: Assignee user ID
- `dueFrom`: Due date from (ISO string)
- `dueTo`: Due date to (ISO string)
- `boardId`: Board ID
- `listId`: List ID

## Real-time Events

The application uses Socket.IO for real-time collaboration. Connect to `/boards/:boardId` namespace with authentication.

### Events

#### card:create
Create a new card.

**Emit:**
```javascript
socket.emit('card:create', {
  listId: 'list-id',
  card: {
    title: 'New card',
    description: 'Card description'
  }
})
```

#### card:update
Update an existing card.

**Emit:**
```javascript
socket.emit('card:update', {
  cardId: 'card-id',
  updates: {
    title: 'Updated title'
  }
})
```

#### card:move
Move card between lists or reorder in same list.

**Emit:**
```javascript
socket.emit('card:move', {
  cardId: 'card-id',
  listId: 'new-list-id',
  position: 1
})
```

## Database Schema

### Core Tables
- **users**: User accounts with authentication data
- **boards**: Collaborative boards owned by users
- **board_members**: Board membership with roles
- **lists**: Columns/lists within boards
- **cards**: Tasks/items within lists
- **comments**: Comments on cards
- **attachments**: File attachments for cards
- **notifications**: User notifications
- **refresh_tokens**: JWT refresh tokens

## Caching Strategy

The application uses Redis for performance optimization:

### Cache Keys
- `board:{boardId}` - Complete board snapshot (5min TTL)
- `board:{boardId}:lists` - Board lists (5min TTL)
- `board:{boardId}:cards` - Board cards (5min TTL)

### Cache Invalidation
Cache is invalidated on any write operation (create/update/delete) to maintain consistency. The cache-aside pattern is used with cache population on read misses.

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/boards_db
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
PORT=4000
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:4000/api
```

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend linting
cd frontend && npm run lint
```

### Database Management
```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Code Quality
```bash
# Lint and format backend
cd backend
npm run lint
npm run format

# Lint and format frontend
cd frontend
npm run lint
npm run format
```

## Deployment

1. Configure production environment variables
2. Update JWT secrets for production
3. Configure proper CORS origins
4. Set up proper logging and monitoring
5. Configure file storage (currently local disk)
6. Set up database backups
7. Configure reverse proxy (nginx/Caddy)

## Security Considerations

- Passwords hashed with argon2
- JWT tokens with secure secrets
- Rate limiting on authentication endpoints
- Input validation with Zod schemas
- CORS configuration
- Helmet security headers
- File upload validation and size limits
- SQL injection prevention via Prisma ORM

## Architecture Decisions

### Why Express + TypeScript?
- Mature ecosystem with excellent TypeScript support
- Flexible middleware system for authentication, validation, etc.
- Good performance and scalability

### Why Prisma?
- Type-safe database access
- Auto-generated migrations
- Excellent developer experience
- Built-in connection pooling

### Why Socket.IO?
- Fallback to HTTP polling for older browsers
- Built-in rooms for board-specific communication
- Automatic reconnection handling

### Why JWT?
- Stateless authentication
- Industry standard
- Good for microservices architecture

### Why Redis for caching?
- Fast in-memory storage
- Built-in TTL support
- Widely used and battle-tested

## Known Limitations

1. **File Storage**: Currently uses local disk storage. For production, consider cloud storage (AWS S3, Google Cloud Storage).
2. **Email Verification**: Uses simulated email verification. Integrate with email service (SendGrid, AWS SES) for production.
3. **Real-time Conflict Resolution**: Basic version-based conflict detection. Consider CRDTs for more advanced collaboration features.
4. **Image Thumbnails**: Not implemented. Add thumbnail generation for better UX.
5. **Pagination**: Basic pagination on search. Consider cursor-based pagination for better performance.
6. **Audit Logging**: No audit trail for sensitive operations.
7. **Rate Limiting**: Basic rate limiting. Consider more sophisticated rules for different user tiers.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
