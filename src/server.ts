import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './routes/auth-routes';
import navRoutes from './routes/nav-routes';
import userRoutes from './routes/user-routes';
import groupRoutes from './routes/group-routes';
import taskRoutes from './routes/task-routes';
import expenseRoutes from './routes/expense-routes';
import contributionRoutes from './routes/contribution-routes';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE SETUP
// ============================================

// EJS View Engine
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Body parsers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================
// ROUTES
// ============================================

// Navigation routes (page rendering)
app.use('/', navRoutes);

// Authentication routes
app.use('/auth', authRoutes);

// API routes (protected)
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/contributions', contributionRoutes);

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Login at: http://localhost:${PORT}/login`);
});