# Folio Builder

A multi-tenant web application that enables students and professionals to create, manage, and customize professional portfolio websites through a visual drag-and-drop builder interface—no coding required.

## Features

### Portfolio Builder
- **Visual Drag-and-Drop Editor** - Intuitive component-based interface for building portfolio pages
- **Multiple Template Themes** - Choose from three professionally designed templates:
  - **Minimal** - Clean, monochrome, professional design
  - **Modern** - Bold gradients, vibrant colors, card-based layout
  - **Creative** - Asymmetric grids, playful typography, bold imagery
- **Live Preview Mode** - See changes in real-time before publishing
- **Rich Component Library** - Nine customizable components:
  - Hero Section (name, title, bio)
  - Header (section headings)
  - Text (rich text paragraphs)
  - Image (with caption and alignment)
  - About Section
  - Project (gallery, tags, links)
  - Experience (company, role, dates)
  - Education (school, degree, dates)
  - Certification (with credentials and images)
  - Divider (section separators)

### AI-Powered Features
- **AI Text Assist** - Powered by Google Gemini for professional content generation
- Context-aware text generation and rewriting
- Helps craft polished descriptions and bios

### Portfolio Management
- Create and manage multiple portfolios
- Save, edit, and delete portfolios
- Duplicate existing portfolios
- Google Drive-style grid view for portfolio organization

### User Authentication
- Secure user registration and login
- Session-based authentication with MySQL storage
- Password hashing with bcrypt
- Protected routes requiring authentication

### Dashboard & Progress Tracking
- Setup checklist for new users
- Progress tracking with completion percentage
- Quick access to portfolio actions

## Tech Stack

### Backend
- **Node.js** with **Express.js** (v5.1.0) - Web server
- **MySQL** (mysql2 v3.15.2) - Database
- **bcrypt** (v6.0.0) - Password hashing
- **express-session** (v1.18.2) - Session management
- **express-mysql-session** (v3.0.3) - MySQL session store
- **dotenv** (v17.2.3) - Environment variable management

### AI Integration
- **Google Generative AI** (@google/generative-ai v0.24.1) - Gemini API for text assistance
- **OpenAI** (v6.10.0) - Additional AI capabilities

### Frontend
- Vanilla **JavaScript** (ES6+)
- **HTML5** and **CSS3**
- **Lucide Icons** - Icon library
- **Material Symbols** - Google icons

### Architecture
- Multi-page Application (MPA)
- Component-based frontend architecture
- Server-side routing
- Session-based authentication
- JSON-based component storage

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **MySQL Server** (v5.7 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/khyquanli/CPSC449_folio_builder.git
cd CPSC449_folio_builder
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up MySQL Database

Create a MySQL database and user:
```sql
CREATE DATABASE mydb;
CREATE USER 'myuser'@'localhost' IDENTIFIED BY 'mypassword';
GRANT ALL PRIVILEGES ON mydb.* TO 'myuser'@'localhost';
FLUSH PRIVILEGES;
```

Create required tables:
```sql
-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolios table
CREATE TABLE portfolios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  template VARCHAR(50) NOT NULL,
  components JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User checklist table
CREATE TABLE user_checklist (
  user_id INT PRIMARY KEY,
  checklist_state JSON,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions table (created automatically by express-mysql-session)
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
```

### 5. Update Database Configuration (Optional)

If you're using different MySQL credentials, update the connection settings in [dbLoginServer.js](dbLoginServer.js#L1-L20):
```javascript
const db = mysql.createPool({
  host: 'localhost',
  user: 'your_mysql_user',
  password: 'your_mysql_password',
  database: 'your_database_name'
});
```

### 6. Start the Server
```bash
node dbLoginServer.js
```

The application will be available at `http://localhost:3000`

## Usage

### Getting Started

1. **Register an Account** - Navigate to `/userRegister.html` to create a new account
2. **Login** - Use your credentials to log in at `/login.html`
3. **Dashboard** - Complete the setup checklist on your dashboard
4. **Create a Portfolio**:
   - Click "Create New Portfolio" from the dashboard or My Portfolios page
   - Choose a template (Minimal, Modern, or Creative)
   - Use the drag-and-drop builder to add components
   - Edit component content using the right-side editor panel
   - Preview your portfolio in real-time
   - Save your portfolio

### Building Your Portfolio

1. **Add Components** - Drag components from the palette to drop zones
2. **Edit Content** - Click on components to edit in the right panel
3. **Rearrange** - Drag components to reorder or use up/down arrows
4. **Use AI Assist** - Click the sparkle icon to generate professional content
5. **Preview** - Toggle preview mode to see the final result
6. **Save** - Click "Save Portfolio" to persist changes

## API Endpoints

### Authentication
- `POST /register` - Create new user account
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /checkSession` - Verify session status
- `GET /getUserInfo` - Get current user data

### Portfolios
- `POST /savePortfolio` - Create or update portfolio
- `GET /getPortfolios` - Get all user's portfolios
- `GET /getPortfolio/:id` - Get single portfolio
- `DELETE /deletePortfolio/:id` - Delete portfolio

### Dashboard
- `GET /getChecklist` - Get user's checklist state
- `POST /saveChecklist` - Update checklist

### AI
- `POST /api/ai/text-assist` - AI-powered text generation/rewriting

## Repository

GitHub: [https://github.com/khyquanli/CPSC449_folio_builder](https://github.com/khyquanli/CPSC449_folio_builder)

## License

This project is part of CPSC 449 coursework.

---
