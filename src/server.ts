import express, { Application } from 'express';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

// ============================================
// IMPORT ROUTES
// ============================================

// Navigation routes (page rendering)
import navRoutes from './routes/nav-routes';

// Authentication routes (login/register/logout)
import authRoutes from './routes/auth-routes';

// API routes (RESTful endpoints)
import userRoutes from './routes/user-routes';
import groupRoutes from './routes/group-routes';
import memberRoutes from './routes/member-routes';  // Member management routes
import taskRoutes from './routes/task-routes';
import expenseRoutes from './routes/expense-routes';
import contributionRoutes from './routes/contribution-routes';

// ============================================
// APPLICATION SETUP
// ============================================

const app: Application = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// VIEW ENGINE CONFIGURATION
// ============================================

// Set views directory (where EJS templates are located)
app.set('views', path.join(__dirname, '..', 'views'));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Enable express-ejs-layouts for layout wrapper support
app.use(expressLayouts);

// Set default layout file (views/layout.ejs)
app.set('layout', 'layout');

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Parse URL-encoded bodies (for HTML form submissions)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (for API requests)
app.use(bodyParser.json());

// Parse cookies (needed for authentication tokens)
app.use(cookieParser());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================
// ROUTES CONFIGURATION
// ============================================

// 1. Navigation Routes (Page Rendering)
// Mounted at root path '/'
// Handles: /, /login, /register, /home, /dashboard/:groupId
app.use('/', navRoutes);

// 2. Authentication Routes (Form-based Authentication)
// Mounted at '/auth'
// Handles: POST /auth/register, POST /auth/login, POST /auth/logout
app.use('/auth', authRoutes);

// 3. API Routes (RESTful JSON Endpoints)
// All API routes are mounted under '/api'

// User management API
// Handles: GET, PUT, DELETE /api/users/:userId
app.use('/api/users', userRoutes);

// Group management API
// Handles: POST, GET, PUT, DELETE /api/groups
app.use('/api/groups', groupRoutes);

// Member management API
// Handles: GET /api/members/group/:groupId, POST /api/members, 
//          DELETE /api/members/:memberId, PUT /api/members/:memberId/promote, 
//          PUT /api/members/:memberId/demote
app.use('/api/members', memberRoutes);

// Task management API (Kanban)
// Handles: POST, GET, PUT, DELETE /api/tasks
app.use('/api/tasks', taskRoutes);

// Expense management API
// Handles: POST, GET, PUT, DELETE /api/expenses
app.use('/api/expenses', expenseRoutes);

// Contribution management API (for expenses)
// Handles: POST, GET, PUT, DELETE /api/contributions
app.use('/api/contributions', contributionRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/home">Go to Home</a>
    `);
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).send(`
        <h1>500 - Server Error</h1>
        <p>Something went wrong on our end.</p>
        <a href="/home">Go to Home</a>
    `);
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 FlowShare Server Started');
    console.log('='.repeat(50));
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Port: ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
    console.log(`Login Page: http://localhost:${PORT}/login`);
    console.log('='.repeat(50));
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

// Export for testing purposes
export default app;