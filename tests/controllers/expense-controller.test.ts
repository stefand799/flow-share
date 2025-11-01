import { Request, Response } from "express";
import * as ExpenseController from "../../src/controllers/expense-controller";
import * as ExpenseService from "../../src/services/expense-service";
import { User, Expense, Currency, RecurrenceInterval } from "@prisma/client";
import { AuthenticatedRequest } from "../../src/middleware/auth-middleware";

jest.mock("../../src/services/expense-service", () => ({
  createExpense: jest.fn(),
  getAllExpenses: jest.fn(),
  getExpenseById: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
}));
const mockExpenseService =
  require("../../src/services/expense-service") as jest.Mocked<
    typeof ExpenseService
  >;

const AUTHENTICATED_USER_ID = 1;
const MOCK_GROUP_ID = 10;
const MOCK_EXPENSE_ID = 5;
const MOCK_DUE_DATE_STRING = "2025-11-15T00:00:00.000Z";

const MOCK_SAFE_USER: Omit<User, "passwordHash"> = {
  id: AUTHENTICATED_USER_ID,
  username: "authuser",
  emailAddress: "auth@test.com",
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const MOCK_EXPENSE: Expense = {
  id: MOCK_EXPENSE_ID,
  title: "Initial Rent Payment",
  description: "Monthly rent split",
  value: 1200.0,
  currency: Currency.USD,
  groupId: MOCK_GROUP_ID,
  isRecurring: true,
  due: new Date(MOCK_DUE_DATE_STRING),
  recurrenceInterval: RecurrenceInterval.MONTHLY,
  createdAt: new Date(),
  updatedAt: new Date(),
  Contributions: [],
} as any;

const EXPENSE_CREATE_BODY = {
  title: "New Expense",
  value: "25.50",
  currency: "USD",
  groupId: MOCK_GROUP_ID.toString(),
  isRecurring: "true",
  due: MOCK_DUE_DATE_STRING,
  recurrenceInterval: "MONTHLY",
};

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

describe("Expense Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockExpenseService.createExpense.mockResolvedValue(MOCK_EXPENSE);
    mockExpenseService.updateExpense.mockResolvedValue(MOCK_EXPENSE);
    mockExpenseService.deleteExpense.mockResolvedValue(true);
    mockExpenseService.getAllExpenses.mockResolvedValue([MOCK_EXPENSE]);
    mockExpenseService.getExpenseById.mockResolvedValue(MOCK_EXPENSE);
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  const AUTH_ERROR = { message: "Authentication required." };
  const EXPENSE_ID_ROUTE = { expenseId: MOCK_EXPENSE_ID.toString() };
  const GROUP_ID_ROUTE = { groupId: MOCK_GROUP_ID.toString() };
  const UNAUTH_REQ = createAuthenticatedRequest({}, {}, null);

  describe("handleCreate", () => {
    const body = EXPENSE_CREATE_BODY;

    it("should return 401 if user is not authenticated", async () => {
      const req = createAuthenticatedRequest({}, body, null);
      const res = mockResponse();
      await ExpenseController.handleCreate(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
    });

    it.each([
      [{ value: "100", groupId: MOCK_GROUP_ID.toString() }],
      [{ title: "Test", groupId: MOCK_GROUP_ID.toString() }],
      [{ title: "Test", value: "100" }],
    ])(
      "should return 400 if required fields are missing (%#)",
      async (partialBody) => {
        const req = createAuthenticatedRequest({}, partialBody);
        const res = mockResponse();
        await ExpenseController.handleCreate(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: "Title, value, and group ID are required.",
        });
      }
    );

    it.each([[{ value: "abc" }], [{ value: "-100" }], [{ value: "0" }]])(
      "should return 400 if value is invalid (%#)",
      async (invalidUpdate) => {
        const req = createAuthenticatedRequest(
          {},
          { ...body, ...invalidUpdate }
        );
        const res = mockResponse();
        await ExpenseController.handleCreate(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: "Value must be a positive number.",
        });
      }
    );

    it("should return 201 and created expense on success", async () => {
      const req = createAuthenticatedRequest({}, body);
      const res = mockResponse();

      await ExpenseController.handleCreate(req, res);

      expect(mockExpenseService.createExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          title: body.title,
          value: 25.5,
          currency: Currency.USD,
          recurrenceInterval: RecurrenceInterval.MONTHLY,
          due: expect.any(Date),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ expense: MOCK_EXPENSE })
      );
    });

    it("should use default enum values if currency or recurrence are invalid/missing", async () => {
      const invalidBody = {
        ...EXPENSE_CREATE_BODY,
        currency: "INVALID_CURRENCY",
        recurrenceInterval: "NEVER_SEEN",
      };
      const req = createAuthenticatedRequest({}, invalidBody);
      const res = mockResponse();

      await ExpenseController.handleCreate(req, res);

      expect(mockExpenseService.createExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: Currency.USD,
          recurrenceInterval: RecurrenceInterval.NONE,
        })
      );
    });

    it("should return 500 if service fails to create task", async () => {
      mockExpenseService.createExpense.mockResolvedValue(null);
      const req = createAuthenticatedRequest({}, body);
      const res = mockResponse();

      await ExpenseController.handleCreate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Could not create expense.",
      });
    });
  });

  describe("handleGetAll", () => {
    const routeParams = GROUP_ID_ROUTE;

    it("should return 401 if user is not authenticated", async () => {
      const req = createAuthenticatedRequest(routeParams, {}, null);
      const res = mockResponse();
      await ExpenseController.handleGetAll(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
    });

    it("should return 400 for invalid groupId format", async () => {
      const req = createAuthenticatedRequest({ groupId: "abc" }, {});
      const res = mockResponse();
      await ExpenseController.handleGetAll(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid group ID format.",
      });
    });

    it("should return 200 and list of expenses on success", async () => {
      const req = createAuthenticatedRequest(routeParams, {});
      const res = mockResponse();
      await ExpenseController.handleGetAll(req, res);
      expect(mockExpenseService.getAllExpenses).toHaveBeenCalledWith(
        MOCK_GROUP_ID
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ expenses: [MOCK_EXPENSE] })
      );
    });
  });

  describe("handleGetExpense", () => {
    const routeParams = EXPENSE_ID_ROUTE;

    it("should return 401 if user is not authenticated", async () => {
      const req = createAuthenticatedRequest(routeParams, {}, null);
      const res = mockResponse();
      await ExpenseController.handleGetExpense(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
    });

    it("should return 400 for invalid expenseId format", async () => {
      const req = createAuthenticatedRequest({ expenseId: "abc" }, {});
      const res = mockResponse();
      await ExpenseController.handleGetExpense(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid expense ID format.",
      });
    });

    it("should return 404 if expense is not found", async () => {
      mockExpenseService.getExpenseById.mockResolvedValue(null);
      const req = createAuthenticatedRequest(routeParams, {});
      const res = mockResponse();
      await ExpenseController.handleGetExpense(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Expense not found." });
    });

    it("should return 200 and expense on success", async () => {
      const req = createAuthenticatedRequest(routeParams, {});
      const res = mockResponse();
      await ExpenseController.handleGetExpense(req, res);
      expect(mockExpenseService.getExpenseById).toHaveBeenCalledWith(
        MOCK_EXPENSE_ID
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ expense: MOCK_EXPENSE });
    });
  });

  describe("handleUpdate", () => {
    const routeParams = EXPENSE_ID_ROUTE;
    const updateBody = { title: "Updated Title", value: "150.99" };

    it("should return 401 if user is not authenticated", async () => {
      const req = createAuthenticatedRequest(routeParams, updateBody, null);
      const res = mockResponse();
      await ExpenseController.handleUpdate(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
    });

    it("should return 400 if expenseId is invalid", async () => {
      const req = createAuthenticatedRequest({ expenseId: "abc" }, updateBody);
      const res = mockResponse();
      await ExpenseController.handleUpdate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it.each([[{ value: "abc" }], [{ value: "-100" }], [{ value: "0" }]])(
      "should return 400 if value in body is invalid (%#)",
      async (invalidUpdate) => {
        const req = createAuthenticatedRequest(routeParams, {
          ...updateBody,
          ...invalidUpdate,
        });
        const res = mockResponse();
        await ExpenseController.handleUpdate(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: "Value must be a positive number.",
        });
      }
    );

    it("should return 400 if no valid fields are provided for update", async () => {
      const req = createAuthenticatedRequest(routeParams, {});
      const res = mockResponse();
      await ExpenseController.handleUpdate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "No valid fields provided for update.",
      });
    });

    it("should return 404 if expense is not found", async () => {
      mockExpenseService.updateExpense.mockResolvedValue(null);
      const req = createAuthenticatedRequest(routeParams, updateBody);
      const res = mockResponse();
      await ExpenseController.handleUpdate(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Expense not found." });
    });

    it("should call service with converted data and return 200 on success", async () => {
      const req = createAuthenticatedRequest(routeParams, updateBody);
      const res = mockResponse();

      await ExpenseController.handleUpdate(req, res);

      expect(mockExpenseService.updateExpense).toHaveBeenCalledWith(
        MOCK_EXPENSE_ID,
        expect.objectContaining({
          title: updateBody.title,
          value: 150.99,
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ expense: MOCK_EXPENSE })
      );
    });

    it("should return 400 if only invalid enum values are provided", async () => {
      const invalidUpdate = {
        currency: "BAD_CURRENCY",
        recurrenceInterval: "WRONG",
      };
      const req = createAuthenticatedRequest(routeParams, invalidUpdate);
      const res = mockResponse();

      await ExpenseController.handleUpdate(req, res);

      expect(mockExpenseService.updateExpense).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "No valid fields provided for update.",
      });
    });

    it("should update successfully with valid fields even if enum values are invalid", async () => {
      const mixedUpdate = {
        title: "Updated Title",
        currency: "BAD_CURRENCY",
        recurrenceInterval: "WRONG",
      };
      const req = createAuthenticatedRequest(routeParams, mixedUpdate);
      const res = mockResponse();
      mockExpenseService.updateExpense.mockResolvedValue(MOCK_EXPENSE);

      await ExpenseController.handleUpdate(req, res);

      expect(mockExpenseService.updateExpense).toHaveBeenCalledWith(
        MOCK_EXPENSE_ID,
        expect.objectContaining({
          title: "Updated Title",
        })
      );

      const callArgs = mockExpenseService.updateExpense.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty("currency");
      expect(callArgs).not.toHaveProperty("recurrenceInterval");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("handleDelete", () => {
    const routeParams = EXPENSE_ID_ROUTE;

    it("should return 401 if user is not authenticated", async () => {
      const req = createAuthenticatedRequest(routeParams, {}, null);
      const res = mockResponse();
      await ExpenseController.handleDelete(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(AUTH_ERROR);
    });

    it("should return 400 for invalid expenseId format", async () => {
      const req = createAuthenticatedRequest({ expenseId: "abc" }, {});
      const res = mockResponse();
      await ExpenseController.handleDelete(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if expense is not found", async () => {
      mockExpenseService.deleteExpense.mockResolvedValue(false);
      const req = createAuthenticatedRequest(routeParams, {});
      const res = mockResponse();
      await ExpenseController.handleDelete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Expense not found." });
    });

    it("should return 200 on successful deletion", async () => {
      mockExpenseService.deleteExpense.mockResolvedValue(true);
      const req = createAuthenticatedRequest(routeParams, {});
      const res = mockResponse();
      await ExpenseController.handleDelete(req, res);
      expect(mockExpenseService.deleteExpense).toHaveBeenCalledWith(
        MOCK_EXPENSE_ID
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Expense deleted successfully.",
      });
    });
  });
});
