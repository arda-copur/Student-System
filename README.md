# Student System

A real-time student management system built with Node.js, Express, MongoDB, and Socket.IO.

## Features

- **User Authentication**: Secure login and registration system
- **Real-time Messaging**: Students can communicate with each other in real-time
- **Note Management**: Create, read, update, and delete study notes
- **Profile Management**: Update profile information and avatar
- **Friend System**: Add and remove friends
- **Rate Limiting**: Protection against brute force attacks
- **Security Features**: XSS protection, MongoDB sanitization, and more

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time Communication**: Socket.IO
- **Security**: Helmet, JWT, bcrypt
- **File Upload**: Multer

## Installation

1. Clone the repository:
```bash
git clone https://github.com/arda-copur/Student-System.git
cd Student-System
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following variables:
```
MONGODB_URI=
PORT=
JWT_SECRET=
CLIENT_URL=
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload avatar
- `GET /api/users/friends` - Get friends list
- `POST /api/users/friends` - Add friend
- `DELETE /api/users/friends/:id` - Remove friend
- `GET /api/users/search` - Search users

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/notes/:id/youtube` - Add YouTube link to note
- `DELETE /api/notes/:id/youtube/:linkId` - Remove YouTube link from note

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/:userId` - Get conversation with specific user
- `POST /api/messages` - Send message
- `PUT /api/messages/read/:conversationId` - Mark messages as read

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Rate limiting for API endpoints
- XSS protection
- MongoDB query sanitization
- Secure HTTP headers with Helmet
- CORS configuration
- Request size limiting
- File upload restrictions

## File Structure

```
student-system/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   └── index.js
├── uploads/
├── .env
├── .gitignore
└── package.json
``` 