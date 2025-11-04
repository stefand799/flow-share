import { 
    createTask, 
    updateTask, 
    deleteTask, 
    getAllTasks, 
    getTaskById, 
    claimTask, 
    unclaimTask, 
    changeTaskStage 
} from '../../src/services/task-service';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    groupMember: {
      findFirst: jest.fn(),
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Stage: {
      TO_DO: 'TO_DO',
      IN_PROGRESS: 'IN_PROGRESS',
      DONE: 'DONE'
    },
    Task: {}, 
  };
});

const { PrismaClient: MockPrismaClient } = require('@prisma/client');
const mockPrisma = new MockPrismaClient();

const MOCK_GROUP_ID = 50;
const MOCK_TASK_ID = 1;
const MOCK_USER_ID = 42;
const MOCK_GROUP_MEMBER_ID = 101;
const MOCK_DUE_DATE = new Date('2025-12-31T00:00:00.000Z');

const MOCK_TASK = {
    id: MOCK_TASK_ID,
    name: 'Test Task',
    description: 'Test Description',
    due: MOCK_DUE_DATE,
    groupId: MOCK_GROUP_ID,
    stage: 'TO_DO',
    groupMemberId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('Task Service', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockPrisma.task.findUnique.mockResolvedValue(MOCK_TASK);
        mockPrisma.task.create.mockResolvedValue(MOCK_TASK);
        mockPrisma.task.update.mockResolvedValue(MOCK_TASK);
        mockPrisma.task.delete.mockResolvedValue(MOCK_TASK);
        mockPrisma.task.findMany.mockResolvedValue([MOCK_TASK]);
    });

    describe('createTask', () => {
        it('should create a task successfully', async () => {
            mockPrisma.task.create.mockResolvedValue(MOCK_TASK);

            const result = await createTask(MOCK_TASK as any, MOCK_GROUP_ID);

            expect(mockPrisma.task.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: MOCK_TASK.name,
                    groupId: MOCK_GROUP_ID,
                }),
            });
            expect(result).toEqual(MOCK_TASK);
        });
    });

    describe('getAllTasks', () => {
        it('should retrieve all tasks for a group', async () => {
            const tasks = [MOCK_TASK, { ...MOCK_TASK, id: 2 }];
            mockPrisma.task.findMany.mockResolvedValue(tasks);

            const result = await getAllTasks(MOCK_GROUP_ID);

            expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
                where: { groupId: MOCK_GROUP_ID },
                include: { assignedTo: { include: { user: true } } },
            });
            expect(result).toEqual(tasks);
        });
    });

    describe('getTaskById', () => {
        it('should return task when found', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(MOCK_TASK);

            const result = await getTaskById(MOCK_TASK_ID);

            expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
                where: { id: MOCK_TASK_ID },
                include: { assignedTo: { include: { user: true } } },
            });
            expect(result).toEqual(MOCK_TASK);
        });

        it('should return null when task not found', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(null);

            const result = await getTaskById(MOCK_TASK_ID);

            expect(result).toBeNull();
        });
    });

    describe('updateTask', () => {
        it('should update task successfully', async () => {
            const updatedTask = { ...MOCK_TASK, name: 'Updated Task' };
            mockPrisma.task.findUnique.mockResolvedValue(MOCK_TASK);
            mockPrisma.task.update.mockResolvedValue(updatedTask);

            const result = await updateTask(updatedTask as any);

            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: MOCK_TASK_ID },
                data: expect.objectContaining({
                    name: 'Updated Task',
                }),
            });
            expect(result).toEqual(updatedTask);
        });

        it('should return null when task not found', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(null);

            const result = await updateTask(MOCK_TASK as any);

            expect(result).toBeNull();
        });
    });

    describe('deleteTask', () => {
        it('should delete task and return true', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(MOCK_TASK);
            mockPrisma.task.delete.mockResolvedValue(MOCK_TASK);

            const result = await deleteTask(MOCK_TASK_ID);

            expect(mockPrisma.task.delete).toHaveBeenCalledWith({
                where: { id: MOCK_TASK_ID },
            });
            expect(result).toBe(true);
        });

        it('should return false when task not found', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(null);

            const result = await deleteTask(MOCK_TASK_ID);

            expect(result).toBe(false);
        });
    });

    describe('claimTask', () => {
        it('should claim task successfully', async () => {
            mockPrisma.groupMember.findFirst.mockResolvedValue({ id: MOCK_GROUP_MEMBER_ID } as any);
            mockPrisma.task.findUnique.mockResolvedValue(MOCK_TASK);
            
            const claimedTask = { ...MOCK_TASK, groupMemberId: MOCK_GROUP_MEMBER_ID };
            mockPrisma.task.update.mockResolvedValue(claimedTask);

            const result = await claimTask(MOCK_TASK_ID, MOCK_USER_ID);

            expect(mockPrisma.groupMember.findFirst).toHaveBeenCalled();
            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: MOCK_TASK_ID },
                data: { groupMemberId: MOCK_GROUP_MEMBER_ID },
            });
            expect(result).toEqual(claimedTask);
        });

        it('should return null if user is not a group member', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(MOCK_TASK);
            mockPrisma.groupMember.findFirst.mockResolvedValue(null);

            const result = await claimTask(MOCK_TASK_ID, MOCK_USER_ID);

            expect(result).toBeNull();
        });
    });

    describe('unclaimTask', () => {
        it('should unclaim task successfully', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(MOCK_TASK);
            const unclaimedTask = { ...MOCK_TASK, groupMemberId: null };
            mockPrisma.task.update.mockResolvedValue(unclaimedTask);

            const result = await unclaimTask(MOCK_TASK_ID);

            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: MOCK_TASK_ID },
                data: { groupMemberId: null },
            });
            expect(result).toEqual(unclaimedTask);
        });

        it('should return null when task not found', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(null);

            const result = await unclaimTask(MOCK_TASK_ID);

            expect(result).toBeNull();
        });
    });

    describe('changeTaskStage', () => {
        it('should change task stage successfully', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(MOCK_TASK);
            const updatedTask = { ...MOCK_TASK, stage: 'DONE' };
            mockPrisma.task.update.mockResolvedValue(updatedTask);

            const result = await changeTaskStage(MOCK_TASK_ID, 'DONE' as any);

            expect(mockPrisma.task.update).toHaveBeenCalledWith({
                where: { id: MOCK_TASK_ID },
                data: { stage: 'DONE' },
            });
            expect(result).toEqual(updatedTask);
        });

        it('should return null when task not found', async () => {
            mockPrisma.task.findUnique.mockResolvedValue(null);

            const result = await changeTaskStage(MOCK_TASK_ID, 'DONE' as any);

            expect(result).toBeNull();
        });
    });
});