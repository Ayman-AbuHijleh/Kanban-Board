# 📋 Task Management Application (Trello Clone)

A full-stack collaborative task management application built with React and Flask, featuring real-time updates, role-based access control, and drag-and-drop functionality.

## 🚀 Features

### Core Functionality
- **Board Management**: Create, organize, and manage multiple project boards
- **Lists & Cards**: Organize tasks into customizable lists with draggable cards
- **Real-time Collaboration**: WebSocket-powered live updates across all users
- **Drag & Drop**: Intuitive card and list reordering using @hello-pangea/dnd
- **Comments System**: Add and manage comments on cards with timestamps
- **Labels**: Color-coded labels for task categorization
- **Card Assignments**: Assign team members to specific tasks
- **Due Dates**: Set and track task deadlines

### User Management
- **Authentication**: Secure JWT-based authentication system
- **Role-Based Access Control**: Three permission levels (Admin, Editor, Viewer)
- **Team Collaboration**: Invite members to boards with specific roles
- **User Profiles**: Personal dashboard with board overview

### Technical Features
- **Real-time Updates**: WebSocket integration for instant synchronization
- **Caching**: Redis-based caching for improved performance
- **Rate Limiting**: API rate limiting to prevent abuse
- **Database Migrations**: Alembic for schema version control
- **Docker Support**: Containerized deployment with Docker Compose
- **Type Safety**: TypeScript on frontend for robust code
- **State Management**: React Query for efficient data fetching and caching

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **TanStack React Query** - Server state management
- **@hello-pangea/dnd** - Drag and drop functionality
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **SASS** - CSS preprocessor
- **Tailwind CSS** - Utility-first CSS framework

### Backend
- **Flask 3.1** - Web framework
- **SQLAlchemy 2.0** - ORM for database operations
- **PostgreSQL** - Primary database
- **Flask-SocketIO** - WebSocket support with eventlet
- **Redis** - Caching layer
- **Flask-Caching** - Server-side caching
- **Flask-Limiter** - Rate limiting
- **PyJWT** - JWT authentication
- **Alembic** - Database migrations
- **Marshmallow** - Object serialization/deserialization
- **Gunicorn** - Production WSGI server

### DevOps
- **Docker & Docker Compose** - Containerization
- **Alembic** - Database version control
- **Flask-Migrate** - Migration management

## 📁 Project Structure

```
.
├── backend/                    # Flask backend application
│   ├── controllers/           # Request handlers and business logic
│   ├── models/               # SQLAlchemy database models
│   ├── routes/               # API route definitions
│   ├── schemas/              # Marshmallow schemas for validation
│   ├── utils/                # Utility functions (auth, cache, websocket)
│   ├── migration/            # Alembic migration files
│   ├── app.py               # Flask application factory
│   ├── database.py          # Database configuration
│   ├── config.py            # Application configuration
│   ├── requirements.txt     # Python dependencies
│   └── docker-compose.yml   # Docker services configuration
│
└── frontend/                  # React frontend application
    ├── src/
    │   ├── components/       # Reusable React components
    │   ├── pages/           # Page-level components
    │   ├── hooks/           # Custom React hooks
    │   ├── services/        # API service layer
    │   ├── types/           # TypeScript type definitions
    │   ├── routes/          # Route configuration
    │   └── utils/           # Utility functions
    ├── package.json         # Node dependencies
    └── vite.config.ts       # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (3.10 or higher)
- **PostgreSQL** (14 or higher)
- **Redis** (6 or higher)
- **Docker & Docker Compose** (optional)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```env
   SECRET_KEY=your-secret-key
   DB_USER=your-db-user
   DB_PASS=your-db-password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=task_management_db
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

5. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

6. **Start the development server**
   ```bash
   python app.py
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint**
   Update `src/services/config.ts` with your backend URL if needed

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Application runs on `http://localhost:5173`

### Docker Setup (Alternative)

1. **Start all services**
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Access the application**
   - Backend API: `http://localhost:5000`
   - Frontend: Configure separately or add to docker-compose

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile

### Boards
- `GET /api/boards` - Get all user boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Board Members
- `GET /api/boards/:id/members` - Get board members
- `POST /api/boards/:id/members` - Invite member to board
- `PUT /api/boards/:boardId/members/:userId` - Update member role
- `DELETE /api/boards/:boardId/members/:userId` - Remove member

### Lists
- `GET /api/boards/:boardId/lists` - Get all lists in board
- `POST /api/lists` - Create new list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list

### Cards
- `GET /api/lists/:listId/cards` - Get all cards in list
- `POST /api/cards` - Create new card
- `GET /api/cards/:id` - Get card details
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `POST /api/cards/:id/assignees` - Assign user to card
- `DELETE /api/cards/:cardId/assignees/:userId` - Remove assignee

### Labels
- `GET /api/boards/:boardId/labels` - Get board labels
- `POST /api/labels` - Create label
- `PUT /api/labels/:id` - Update label
- `DELETE /api/labels/:id` - Delete label

### Comments
- `GET /api/cards/:cardId/comments` - Get card comments
- `POST /api/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

## 🔌 WebSocket Events

### Client → Server
- `join_board` - Join board room for updates
- `leave_board` - Leave board room

### Server → Client
- `card:created` - New card created
- `card:updated` - Card updated
- `card:deleted` - Card deleted
- `card:moved` - Card moved between lists
- `card:assignee_added` - Assignee added to card
- `card:assignee_removed` - Assignee removed from card
- `card:label_added` - Label added to card
- `card:label_removed` - Label removed from card
- `list:created` - New list created
- `list:updated` - List updated
- `list:deleted` - List deleted
- `list:moved` - List position changed
- `comment:created` - New comment added
- `comment:updated` - Comment updated
- `comment:deleted` - Comment deleted

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **CORS Protection**: Configured Cross-Origin Resource Sharing
- **Rate Limiting**: API endpoint rate limiting
- **Role-Based Access**: Granular permission control
- **SQL Injection Prevention**: SQLAlchemy ORM protection
- **XSS Prevention**: Input sanitization and validation

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📦 Deployment

### Backend Production
```bash
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 wsgi:app
```

### Frontend Production
```bash
npm run build
```
Serve the `dist` folder using a static file server (Nginx, Apache, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.


## 🙏 Acknowledgments

- Inspired by Trello's collaborative task management approach
- Built as a capstone project to demonstrate full-stack development skills
- Special thanks to the open-source community for the amazing tools and libraries



---

⭐ Star this repository if you find it helpful!
