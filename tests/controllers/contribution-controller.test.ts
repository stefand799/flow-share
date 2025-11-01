import { Request, Response } from "express";
import * as ContributionController from "../../src/controllers/contribution-controller";
import { User, Contribution } from "@prisma/client";
import { AuthenticatedRequest } from "../../src/middleware/auth-middleware";
import * as ContributionService from "../../src/services/contribution-service";

jest.mock("../../src/services/contribution-service", () => ({
  getGroupMemberIdByUserIdAndGroupId: jest.fn(),
  findExistingContribution: jest.fn(),
  createContribution: jest.fn(),
  updateContribution: jest.fn(),
  deleteContribution: jest.fn(),
  getAllContributionsByExpense: jest.fn(),
}));
const mockContributionService =
  require("../../src/services/contribution-service") as jest.Mocked<
    typeof ContributionService
  >;

const AUTHENTICATED_USER_ID = 1;
const MOCK_EXPENSE_ID = 101;
const MOCK_GROUP_ID = 5;
const MOCK_CONTRIBUTION_ID = 42;
const MOCK_GROUP_MEMBER_ID = 55;
const MOCK_VALUE = 25.5;

const MOCK_SAFE_USER: Omit<User, "passwordHash"> = {
  id: AUTHENTICATED_USER_ID,
  username: "authuser",
  emailAddress: "auth@test.com",
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const MOCK_CONTRIBUTION: Contribution = {
  id: MOCK_CONTRIBUTION_ID,
  value: MOCK_VALUE,
  expenseId: MOCK_EXPENSE_ID,
  groupMemberId: MOCK_GROUP_MEMBER_ID,
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

const AUTH_ERROR = { message: "Authentication required." };
const UN_AUTH_REQ = createAuthenticatedRequest({}, {}, null);

describe("Contribution Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});

    mockContributionService.getGroupMemberIdByUserIdAndGroupId.mockResolvedValue(
      MOCK_GROUP_MEMBER_ID
    );
    mockContributionService.createContribution.mockResolvedValue(
      MOCK_CONTRIBUTION
    );
    mockContributionService.updateContribution.mockResolvedValue(
      MOCK_CONTRIBUTION
    );
    mockContributionService.deleteContribution.mockResolvedValue(true);
    mockContributionService.getAllContributionsByExpense.mockResolvedValue([
      MOCK_CONTRIBUTION,
    ]);
    mockContributionService.findExistingContribution.mockResolvedValue(null);
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe("handleCreate (Create/Update)", () => {
    const validBody = {
      value: MOCK_VALUE.toString(),
      expenseId: MOCK_EXPENSE_ID.toString(),
      groupId: MOCK_GROUP_ID.toString(),
    };

    it("should return 401 if user is not authenticated", async () => {
      const res = mockResponse();
      await ContributionController.handleCreate(UN_AUTH_REQ, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it.each([
      ["missing value", { ...validBody, value: undefined }],
      ["missing expenseId", { ...validBody, expenseId: undefined }],
      ["missing groupId", { ...validBody, groupId: undefined }],
    ])("should return 400 for %s in body", async (testName, body) => {
      const req = createAuthenticatedRequest({}, body);
      const res = mockResponse();
      await ContributionController.handleCreate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Value, Expense ID, and Group ID are required.",
      });
    });

    it.each([
      ["non-positive value", { ...validBody, value: "-10" }],
      ["non-numeric value", { ...validBody, value: "abc" }],
    ])("should return 400 for %s", async (testName, body) => {
      const req = createAuthenticatedRequest({}, body);
      const res = mockResponse();
      await ContributionController.handleCreate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Value must be a positive number.",
      });
    });

    it("should return 403 if user is not a member of the group", async () => {
      mockContributionService.getGroupMemberIdByUserIdAndGroupId.mockResolvedValue(
        null
      );
      const req = createAuthenticatedRequest({}, validBody);
      const res = mockResponse();
      await ContributionController.handleCreate(req, res);

      expect(
        mockContributionService.getGroupMemberIdByUserIdAndGroupId
      ).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "You are not a member of this group.",
      });
    });

    it("should CREATE a new contribution and return 201 if none exists", async () => {
      const req = createAuthenticatedRequest({}, validBody);
      const res = mockResponse();

      await ContributionController.handleCreate(req, res);

      expect(
        mockContributionService.findExistingContribution
      ).toHaveBeenCalled();
      expect(mockContributionService.createContribution).toHaveBeenCalledWith({
        value: MOCK_VALUE,
        expenseId: MOCK_EXPENSE_ID,
        groupMemberId: MOCK_GROUP_MEMBER_ID,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isUpdate: false,
          contribution: MOCK_CONTRIBUTION,
        })
      );
    });

    it("should UPDATE an existing contribution and return 200 if one exists", async () => {
      mockContributionService.findExistingContribution.mockResolvedValue(
        MOCK_CONTRIBUTION
      );
      const updatedContributionMock = {
        ...MOCK_CONTRIBUTION,
        value: MOCK_VALUE,
      };
      mockContributionService.updateContribution.mockResolvedValue(
        updatedContributionMock
      );

      const req = createAuthenticatedRequest({}, validBody);
      const res = mockResponse();

      await ContributionController.handleCreate(req, res);

      expect(mockContributionService.updateContribution).toHaveBeenCalledWith(
        MOCK_CONTRIBUTION_ID,
        MOCK_VALUE
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isUpdate: true,
          contribution: updatedContributionMock,
        })
      );
    });

    it("should return 500 if creation fails", async () => {
      mockContributionService.createContribution.mockResolvedValue(null);
      const req = createAuthenticatedRequest({}, validBody);
      const res = mockResponse();
      await ContributionController.handleCreate(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to create contribution.",
      });
    });
  });

  describe("handleGetAll (By Expense)", () => {
    const routeParams = { expenseId: MOCK_EXPENSE_ID.toString() };

    it("should return 401 if user is not authenticated", async () => {
      const req = createAuthenticatedRequest(routeParams, {}, null);
      const res = mockResponse();
      await ContributionController.handleGetAll(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 400 for invalid expense ID format", async () => {
      const req = createAuthenticatedRequest({ expenseId: "abc" }, {});
      const res = mockResponse();
      await ContributionController.handleGetAll(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid expense ID format.",
      });
    });

    it("should return 200 and contributions list on success", async () => {
      const req = createAuthenticatedRequest(routeParams, {});
      const res = mockResponse();
      await ContributionController.handleGetAll(req, res);

      expect(
        mockContributionService.getAllContributionsByExpense
      ).toHaveBeenCalledWith(MOCK_EXPENSE_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        contributions: [MOCK_CONTRIBUTION],
      });
    });
  });

  describe("handleUpdate", () => {
    const routeParams = { contributionId: MOCK_CONTRIBUTION_ID.toString() };
    const validBody = { value: "30.00" };
    const valueFloat = 30.0;

    it("should return 401 if user is not authenticated", async () => {
      const res = mockResponse();
      await ContributionController.handleUpdate(UN_AUTH_REQ, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 400 for invalid contribution ID format", async () => {
      const req = createAuthenticatedRequest(
        { contributionId: "abc" },
        validBody
      );
      const res = mockResponse();
      await ContributionController.handleUpdate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid contribution ID format.",
      });
    });

    it.each([
      ["non-positive value", { value: "-10" }],
      ["non-numeric value", { value: "invalid" }],
    ])("should return 400 for %s value", async (testName, body) => {
      const req = createAuthenticatedRequest(routeParams, body);
      const res = mockResponse();
      await ContributionController.handleUpdate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Value must be a positive number.",
      });
    });

    it("should return 404 if contribution is not found", async () => {
      mockContributionService.updateContribution.mockResolvedValue(null);
      const req = createAuthenticatedRequest(routeParams, validBody);
      const res = mockResponse();
      await ContributionController.handleUpdate(req, res);

      expect(mockContributionService.updateContribution).toHaveBeenCalledWith(
        MOCK_CONTRIBUTION_ID,
        valueFloat
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Contribution not found.",
      });
    });

    it("should return 200 and updated contribution on success", async () => {
      const UPDATED_CONTRIBUTION = { ...MOCK_CONTRIBUTION, value: valueFloat };
      mockContributionService.updateContribution.mockResolvedValue(
        UPDATED_CONTRIBUTION
      );
      const req = createAuthenticatedRequest(routeParams, validBody);
      const res = mockResponse();

      await ContributionController.handleUpdate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ contribution: UPDATED_CONTRIBUTION })
      );
    });
  });

  describe("handleDelete", () => {
    const routeParams = { contributionId: MOCK_CONTRIBUTION_ID.toString() };

    it("should return 401 if user is not authenticated", async () => {
      const res = mockResponse();
      await ContributionController.handleDelete(UN_AUTH_REQ, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 400 for invalid contribution ID format", async () => {
      const req = createAuthenticatedRequest({ contributionId: "abc" }, {});
      const res = mockResponse();
      await ContributionController.handleDelete(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if contribution is not found", async () => {
      mockContributionService.deleteContribution.mockResolvedValue(false);
      const req = createAuthenticatedRequest(routeParams, {});
      const res = mockResponse();
      await ContributionController.handleDelete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Contribution not found.",
      });
    });

    it("should return 200 on successful deletion", async () => {
      mockContributionService.deleteContribution.mockResolvedValue(true);
      const req = createAuthenticatedRequest(routeParams, {});
      const res = mockResponse();

      await ContributionController.handleDelete(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Contribution deleted successfully.",
      });
    });
  });
});
