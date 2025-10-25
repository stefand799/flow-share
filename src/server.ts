import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

// --- Import All Application Routes ---
import authRoutes from './routes/auth-routes';
import userRoutes from './routes/user-routes';
import groupRoutes from './routes/group-routes';
// Imported new API routes
import contributionRoutes from './routes/contribution-routes';
import expenseRoutes from './routes/expense-routes';
import taskRoutes from './routes/task-routes';
import navRoutes from './routes/nav-routes'; // For navigation/page rendering

// --- Configuration ---
const app = express();
// Setting PORT from environment variables for deployment, defaulting to 3000
const PORT = process.env.PORT || 3000;

// --- Middleware Setup ---

// 1. EJS View Engine and Layouts
// Set the base directory for views
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// Use express-ejs-layouts for wrapping pages inside views/layout.ejs
app.use(expressLayouts);
// Set the default layout file
app.set('layout', 'layout'); 

// 2. Parsers
// Parse application/x-www-form-urlencoded, necessary for traditional form submissions
app.use(bodyParser.urlencoded({ extended: true })); 
// Parse application/json, essential for API routes (PUT, DELETE, JSON POST)
app.use(bodyParser.json()); 
// Parse cookies, needed for reading the 'token' cookie in auth-middleware
app.use(cookieParser());

// 3. Static Files (e.g., CSS, JS, images from the 'public' folder)
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Application Routes (Middleware & Controllers) ---

// 1. Authentication and User Routes (Mounted under /auth and /users)
// Authentication routes (Login/Register POSTs)
app.use('/auth', authRoutes);

// User Profile/Data API routes
app.use('/api/users', userRoutes);

// Group Management API routes
app.use('/api/groups', groupRoutes);

// Task Management API routes (UNCOMMENTED)
app.use('/api/tasks', taskRoutes);

// Expense Management API routes (UNCOMMENTED)
app.use('/api/expenses', expenseRoutes);

// Contribution Management API routes (UNCOMMENTED)
app.use('/api/contributions', contributionRoutes);


// 2. Navigation Routes (Page Rendering)
// The 'nav-routes' handles all GET requests for rendering EJS pages (login, register, main, etc.)
app.use('/', navRoutes); 


// --- Fallback/Home Route ---
// A simple catch-all for the root that redirects to the primary entry point (login)
app.get('/', (req, res) => {
    res.redirect('/login');
});


// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`View login page: http://localhost:${PORT}/login`);
});
