import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';

// --- MOCK SERVICE SETUP ---

// 1. Define the mock dependencies inside the jest.mock factory function
// to prevent "Cannot access 'mockAuthService' before initialization" error.

const mockAuthService = {
    registerUser: jest.fn(),
    loginUser: jest.fn(),
};
// Use a factory function to return the mock object
jest.mock('../src/services/auth-service', () => mockAuthService); 

const mockUserService = {
    findUserById: jest.fn(),
};
// Use a factory function to return the mock object
jest.mock('../src/services/user-service', () => mockUserService);

// --- END MOCK SERVICE SETUP ---

// Import the auth routes to test (must happen AFTER dependencies are mocked)
import AuthRoutes from '../src/routes/auth-routes';


// The mock user object used for successful authentication
const MOCK_USER = {
    id: 1,
    username: 'testuser',
    emailAddress: 'test@example.com',
    // Omitted fields as it's the SafeUser type in req.user
};
const MOCK_TOKEN = 'mock.valid.token';

// Helper function to create a minimal Express app for testing
const createApp = (): Express => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    // Attach the auth routes under a common path (e.g., /auth)
    app.use('/auth', AuthRoutes);

    // Mock the redirect calls since supertest can't follow them naturally
    app.use((req: Request, res: Response, next: NextFunction) => {
        // Fix: Use rest parameters to satisfy all overloads of res.redirect
        const originalRedirect = res.redirect.bind(res);
        res.redirect = (...args: any[]) => {
            // Determine the URL, which is always the last argument in Express's redirect
            const url = args[args.length - 1]; 
            
            // Instead of redirecting, we send a custom status (302) and a body to check in the test
            res.status(302).send({ redirect: url });
            return res;
        };
        next();
    });

    return app;
};

let app: Express;

describe('Auth API Integration Tests (Controller/Routes)', () => {
    beforeAll(() => {
        app = createApp();
    });
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock a successful authentication path for protected routes
        // The mock middleware needs to resolve a user object
        // NOTE: The mock must be applied to the 'findUserById' in the user-service mock,
        // as the 'authenticate' middleware calls it.
        mockUserService.findUserById.mockResolvedValue(MOCK_USER); 
    });

    // --- REGISTER ROUTE TESTS ---

    test('1. POST /auth/register should succeed and set cookie on success', async () => {
        mockAuthService.registerUser.mockResolvedValue({
            user: MOCK_USER,
            token: MOCK_TOKEN,
        });

        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'newuser',
                emailAddress: 'new@test.com',
                password: 'password123',
            });

        // Controller should redirect on success
        expect(response.statusCode).toBe(302);
        expect(response.body.redirect).toBe('nav/main-page');

        // Controller must set the 'token' cookie
        const setCookieHeader = response.headers['set-cookie'][0];
        expect(setCookieHeader).toContain(`token=${MOCK_TOKEN}`);
        // In a real environment, NODE_ENV would be checked for secure flag.
        // We ensure HttpOnly is always present for security.
        expect(setCookieHeader).toContain('HttpOnly'); 
    });

    test('2. POST /auth/register should return 400 and error message on service failure', async () => {
        mockAuthService.registerUser.mockRejectedValue(new Error('Username or email already in use.'));

        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'failuser',
                emailAddress: 'fail@test.com',
                password: 'password123',
            });

        // Controller should return 400 status
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Username or email already in use.');
        expect(response.headers['set-cookie']).toBeUndefined(); // No cookie set on failure
    });

    // --- LOGIN ROUTE TESTS ---

    test('3. POST /auth/login should succeed and set cookie on successful login', async () => {
        mockAuthService.loginUser.mockResolvedValue({
            user: MOCK_USER,
            token: MOCK_TOKEN,
        });

        const response = await request(app)
            .post('/auth/login')
            .send({ credentials: 'testuser', password: 'password123' });

        // Controller should redirect on success
        expect(response.statusCode).toBe(302);
        expect(response.body.redirect).toBe('nav/main-page');

        // Controller must set the 'token' cookie
        const setCookieHeader = response.headers['set-cookie'][0];
        expect(setCookieHeader).toContain(`token=${MOCK_TOKEN}`);
    });

    test('4. POST /auth/login should return 400 on invalid credentials/password', async () => {
        mockAuthService.loginUser.mockRejectedValue(new Error('Invalid password'));

        const response = await request(app)
            .post('/auth/login')
            .send({ credentials: 'testuser', password: 'wrongpassword' });

        // Controller should return 400 status
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Invalid password');
    });

    // --- LOGOUT ROUTE (Protected) TESTS ---

    test('5. POST /auth/logout should clear the cookie and redirect on success', async () => {
        // We don't need to mock the service here, only the middleware check (which uses user-service)
        
        const response = await request(app)
            .post('/auth/logout')
            // Simulate a valid token in the request cookie to pass the middleware check
            .set('Cookie', [`token=${MOCK_TOKEN}`]) 
            .send({});

        // Controller should clear the cookie
        const clearCookieHeader = response.headers['set-cookie'][0];
        expect(clearCookieHeader).toContain('token=;');
        expect(clearCookieHeader).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT'); // Check for expiration

        // Controller should redirect to login page
        expect(response.statusCode).toBe(302);
        expect(response.body.redirect).toBe('nav/login-page');
    });
});
