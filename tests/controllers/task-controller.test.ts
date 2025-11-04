import { Request, Response } from "express";
import * as TaskController from '../../src/controllers/task-controller';
import * as TaskService from "../../src/services/task-service";
import { User, Task, Stage } from "@prisma/client"; 
import { AuthenticatedRequest } from "../../src/middleware/auth-middleware"; 

jest.mock('../../src/services/task-service', () => ({
    createTask: jest.fn(),
    getAllTasks: jest.fn(),
    getTaskById: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    claimTask: jest.fn(),
    unclaimTask: jest.fn(),
    changeTaskStage: jest.fn(),
}));
const mockTaskService = require('../../src/services/task-service') as jest.Mocked<typeof TaskService>;


const AUTHENTICATED_USER_ID = 1;
const MOCK_GROUP_ID = 10;
const MOCK_TASK_ID = 5;
const MOCK_DUE_DATE = "2025-11-15T00:00:00.000Z";
const STAGE_TODO = 'TO_DO' as Stage;
const STAGE_IN_PROGRESS = 'IN_PROGRESS' as Stage;
const STAGE_DONE = 'DONE' as Stage;

const MOCK_SAFE_USER: Omit<User, 'passwordHash'> = {
    id: AUTHENTICATED_USER_ID,
    username: 'authuser',
    emailAddress: 'auth@test.com',
    isVerified: true, createdAt: new Date(), updatedAt: new Date(),
} as any; 

const MOCK_TASK: Task = {
    id: MOCK_TASK_ID,
    name: "Initial Task",
    description: "Task description.",
    due: new Date(MOCK_DUE_DATE),
    groupId: MOCK_GROUP_ID,
    stage: STAGE_TODO, 
    groupMemberId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any;

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res as Response;
};

const createAuthenticatedRequest = (
    params: Record<string, any> = {}, 
    body: Record<string, any> = {}, 
    user: any = MOCK_SAFE_USER
): AuthenticatedRequest => {
    const req: any = {
        params,
        body,
    };
    
    if (user !== null) {
        req.user = user;
    }
    
    return req as AuthenticatedRequest;
};

describe('Task Controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mockTaskService.createTask.mockResolvedValue(MOCK_TASK);
        mockTaskService.updateTask.mockResolvedValue(MOCK_TASK);
        mockTaskService.deleteTask.mockResolvedValue(true);
        mockTaskService.getTaskById.mockResolvedValue(MOCK_TASK);
        mockTaskService.claimTask.mockResolvedValue(MOCK_TASK);
        mockTaskService.unclaimTask.mockResolvedValue(MOCK_TASK);
        mockTaskService.changeTaskStage.mockResolvedValue(MOCK_TASK);
        mockTaskService.getAllTasks.mockResolvedValue([MOCK_TASK]);
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });
    
    const AUTH_ERROR = { message: "Authentication required." };
    const TASK_ID_ROUTE = { taskId: MOCK_TASK_ID.toString() };
    const GROUP_ID_BODY = { groupId: MOCK_GROUP_ID.toString() };
    const TASK_DATA_BODY = { name: "New Task Name", description: "New Desc", due: MOCK_DUE_DATE };

    describe('handleCreate', () => {
        const body = { ...TASK_DATA_BODY, ...GROUP_ID_BODY };

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest({}, body, null);
            const res = mockResponse();
            await TaskController.handleCreate(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
        });

        it('should return 400 if name or groupId is missing', async () => {
            const req = createAuthenticatedRequest({}, { groupId: MOCK_GROUP_ID.toString() });
            const res = mockResponse();
            await TaskController.handleCreate(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Task name and group ID are required." });
        });

        it('should return 201 and created task on success', async () => {
            const req = createAuthenticatedRequest({}, body);
            const res = mockResponse();

            await TaskController.handleCreate(req, res);

            expect(mockTaskService.createTask).toHaveBeenCalledWith(
                expect.objectContaining({ name: TASK_DATA_BODY.name }),
                MOCK_GROUP_ID
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ task: MOCK_TASK }));
        });
        
        it('should return 500 if service fails to create task', async () => {
            mockTaskService.createTask.mockResolvedValue(null);
            const req = createAuthenticatedRequest({}, body);
            const res = mockResponse();

            await TaskController.handleCreate(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Could not create task." });
        });
    });

    describe('handleGetAll', () => {
        const routeParams = { groupId: MOCK_GROUP_ID.toString() };

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(routeParams, {}, null); 
            const res = mockResponse();
            await TaskController.handleGetAll(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
        });

        it('should return 400 for invalid groupId format', async () => {
            const req = createAuthenticatedRequest({ groupId: 'abc' }, {});
            const res = mockResponse();
            await TaskController.handleGetAll(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid group ID format." });
        });

        it('should return 200 and list of tasks on success', async () => {
            const req = createAuthenticatedRequest(routeParams, {});
            const res = mockResponse();
            await TaskController.handleGetAll(req, res);
            expect(mockTaskService.getAllTasks).toHaveBeenCalledWith(MOCK_GROUP_ID);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ tasks: [MOCK_TASK] }));
        });
    });
    
    describe('handleGetTask', () => {
        const routeParams = TASK_ID_ROUTE;

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(routeParams, {}, null); 
            const res = mockResponse();
            await TaskController.handleGetTask(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
        });

        it('should return 400 for invalid taskId format', async () => {
            const req = createAuthenticatedRequest({ taskId: 'abc' }, {});
            const res = mockResponse();
            await TaskController.handleGetTask(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if task is not found', async () => {
            mockTaskService.getTaskById.mockResolvedValue(null);
            const req = createAuthenticatedRequest(routeParams, {});
            const res = mockResponse();
            await TaskController.handleGetTask(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 200 and task on success', async () => {
            const req = createAuthenticatedRequest(routeParams, {});
            const res = mockResponse();
            await TaskController.handleGetTask(req, res);
            expect(mockTaskService.getTaskById).toHaveBeenCalledWith(MOCK_TASK_ID);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ task: MOCK_TASK });
        });
    });

    describe('handleUpdate', () => {
        const routeParams = TASK_ID_ROUTE;
        const body = { ...TASK_DATA_BODY, name: 'Updated Name' };

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(routeParams, body, null); 
            const res = mockResponse();
            await TaskController.handleUpdate(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
        });

        it('should return 400 if taskId is invalid', async () => {
            const req = createAuthenticatedRequest({ taskId: 'abc' }, body);
            const res = mockResponse();
            await TaskController.handleUpdate(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if name is missing', async () => {
            const req = createAuthenticatedRequest(routeParams, { description: 'test' });
            const res = mockResponse();
            await TaskController.handleUpdate(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Task name is required." });
        });

        it('should return 404 if task is not found', async () => {
            mockTaskService.updateTask.mockResolvedValue(null);
            const req = createAuthenticatedRequest(routeParams, body);
            const res = mockResponse();
            await TaskController.handleUpdate(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 200 and updated task on success', async () => {
            const UPDATED_TASK = { ...MOCK_TASK, name: body.name };
            mockTaskService.updateTask.mockResolvedValue(UPDATED_TASK);
            const req = createAuthenticatedRequest(routeParams, body);
            const res = mockResponse();
            
            await TaskController.handleUpdate(req, res);
            
            expect(mockTaskService.updateTask).toHaveBeenCalledWith(
                expect.objectContaining({ id: MOCK_TASK_ID, name: body.name })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ task: UPDATED_TASK }));
        });
    });

    describe('handleDelete', () => {
        const routeParams = TASK_ID_ROUTE;
        
        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(routeParams, {}, null); 
            const res = mockResponse();
            await TaskController.handleDelete(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
        });

        it('should return 400 for invalid taskId format', async () => {
            const req = createAuthenticatedRequest({ taskId: 'abc' }, {});
            const res = mockResponse();
            await TaskController.handleDelete(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if task is not found', async () => {
            mockTaskService.deleteTask.mockResolvedValue(false);
            const req = createAuthenticatedRequest(routeParams, {});
            const res = mockResponse();
            await TaskController.handleDelete(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 200 on successful deletion', async () => {
            mockTaskService.deleteTask.mockResolvedValue(true);
            const req = createAuthenticatedRequest(routeParams, {});
            const res = mockResponse();
            await TaskController.handleDelete(req, res);
            expect(mockTaskService.deleteTask).toHaveBeenCalledWith(MOCK_TASK_ID);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Task deleted successfully." });
        });
    });

    describe('handleClaim', () => {
        const routeParams = TASK_ID_ROUTE;
        
        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(routeParams, {}, null); 
            const res = mockResponse();
            await TaskController.handleClaim(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
        });

        it('should return 400 for invalid taskId format', async () => {
            const req = createAuthenticatedRequest({ taskId: 'abc' }, {});
            const res = mockResponse();
            await TaskController.handleClaim(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if task cannot be claimed (not found or not member)', async () => {
            mockTaskService.claimTask.mockResolvedValue(null);
            const req = createAuthenticatedRequest(routeParams, {});
            const res = mockResponse();
            await TaskController.handleClaim(req, res);
            
            expect(mockTaskService.claimTask).toHaveBeenCalledWith(MOCK_TASK_ID, AUTHENTICATED_USER_ID);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 200 and claimed task on success', async () => {
            const CLAIMED_TASK = { ...MOCK_TASK, groupMemberId: 101 };
            mockTaskService.claimTask.mockResolvedValue(CLAIMED_TASK);
            const req = createAuthenticatedRequest(routeParams, {});
            const res = mockResponse();
            
            await TaskController.handleClaim(req, res);
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ task: CLAIMED_TASK }));
        });
    });
    
    describe('handleUnclaim', () => {
        const routeParams = TASK_ID_ROUTE;

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(routeParams, {}, null); 
            const res = mockResponse();
            await TaskController.handleUnclaim(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
        });

        it('should return 400 for invalid taskId format', async () => {
            const req = createAuthenticatedRequest({ taskId: 'abc' }, {});
            const res = mockResponse();
            await TaskController.handleUnclaim(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if task is not found', async () => {
            mockTaskService.unclaimTask.mockResolvedValue(null);
            const req = createAuthenticatedRequest(routeParams, {});
            const res = mockResponse();
            await TaskController.handleUnclaim(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 200 and unclaimed task on success', async () => {
            const UNCLAIMED_TASK = { ...MOCK_TASK, groupMemberId: null };
            mockTaskService.unclaimTask.mockResolvedValue(UNCLAIMED_TASK);
            const req = createAuthenticatedRequest(routeParams, {});
            const res = mockResponse();
            
            await TaskController.handleUnclaim(req, res);
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ task: UNCLAIMED_TASK }));
        });
    });
    
    describe('handleChangeStage', () => {
        const routeParams = TASK_ID_ROUTE;
        const NEW_STAGE = STAGE_IN_PROGRESS;
        const body = { stage: NEW_STAGE };

        it('should return 401 if user is not authenticated', async () => {
            const req = createAuthenticatedRequest(routeParams, body, null);
            const res = mockResponse();
            await TaskController.handleChangeStage(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
        });

        it('should return 400 if taskId is invalid', async () => {
            const req = createAuthenticatedRequest({ taskId: 'abc' }, body);
            const res = mockResponse();
            await TaskController.handleChangeStage(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 if stage is missing or invalid', async () => {
            let req = createAuthenticatedRequest(routeParams, { });
            let res = mockResponse();
            await TaskController.handleChangeStage(req, res);
            expect(res.status).toHaveBeenCalledWith(400);

            req = createAuthenticatedRequest(routeParams, { stage: 'INVALID_STAGE' });
            res = mockResponse();
            await TaskController.handleChangeStage(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Valid stage is required (TO_DO, IN_PROGRESS, or DONE)." });
        });

        it('should return 404 if task is not found', async () => {
            mockTaskService.changeTaskStage.mockResolvedValue(null);
            const req = createAuthenticatedRequest(routeParams, body);
            const res = mockResponse();
            await TaskController.handleChangeStage(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 200 and updated task on success', async () => {
            const UPDATED_TASK = { ...MOCK_TASK, stage: NEW_STAGE };
            mockTaskService.changeTaskStage.mockResolvedValue(UPDATED_TASK);
            const req = createAuthenticatedRequest(routeParams, body);
            const res = mockResponse();
            
            await TaskController.handleChangeStage(req, res);
            
            expect(mockTaskService.changeTaskStage).toHaveBeenCalledWith(MOCK_TASK_ID, NEW_STAGE); 
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: `Task stage updated to ${NEW_STAGE}.`,
                task: UPDATED_TASK
            }));
        });
    });
});