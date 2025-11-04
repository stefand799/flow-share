import { Request, Response } from "express";
import * as UserService from "../../src/services/user-service";
import {
  handleGetUser,
  handleUpdate,
  handleDelete,
} from "../../src/controllers/user-controller";
import { User } from "@prisma/client";

interface AuthenticateRequest extends Request {
  user?: SafeUser;
}
type SafeUser = Omit<User, "passwordHash">;

jest.mock("../../src/services/user-service", () => ({
  findUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

const mockUserService = UserService as jest.Mocked<typeof UserService>;

const AUTHENTICATED_USER_ID = 10;
const OTHER_USER_ID = 20;

const MOCK_SAFE_USER: SafeUser = {
  id: AUTHENTICATED_USER_ID,
  username: "testuser",
  firstName: "Test",
  lastName: "User",
  emailAddress: "test@example.com",
  phoneNumber: "555-1212",
  bio: "Test bio",
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as SafeUser;

const MOCK_UPDATE_DATA = {
  firstName: "UpdatedName",
  bio: "New bio content",
};
const MOCK_FULL_UPDATE_USER: User = {
  ...MOCK_SAFE_USER,
  ...MOCK_UPDATE_DATA,
  passwordHash: "dummyhash",
} as User;

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res as Response;
};

jest.spyOn(console, "error").mockImplementation(() => {});

describe("User Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  const createAuthenticatedRequest = (
    paramsId: string | number,
    userId: number,
    body: any = {}
  ): AuthenticateRequest =>
    ({
      params: { userId: String(paramsId) },
      user: { id: userId } as any,
      body: body,
      cookies: {},
      signedCookies: {},
      get: jest.fn(),
      header: jest.fn(),
    } as unknown as AuthenticateRequest);

  describe("handleGetUser", () => {
    it("should return 200 and the user data for the authenticated user", async () => {
      const req = createAuthenticatedRequest(
        AUTHENTICATED_USER_ID,
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      mockUserService.findUserById.mockResolvedValue(MOCK_SAFE_USER);

      await handleGetUser(req, res);

      expect(mockUserService.findUserById).toHaveBeenCalledWith(
        AUTHENTICATED_USER_ID
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ user: MOCK_SAFE_USER });
    });

    it("should return 400 if the userId parameter is not a number", async () => {
      const req = createAuthenticatedRequest(
        "invalidID",
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      await handleGetUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid user ID format.",
      });
      expect(mockUserService.findUserById).not.toHaveBeenCalled();
    });

    it("should return 403 if the authenticated user ID does not match the requested ID", async () => {
      const req = createAuthenticatedRequest(
        OTHER_USER_ID,
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      await handleGetUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Access denied. You can only view your own profile.",
      });
    });

    it("should return 404 if the user is not found by the service", async () => {
      const req = createAuthenticatedRequest(
        AUTHENTICATED_USER_ID,
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      mockUserService.findUserById.mockResolvedValue(null);

      await handleGetUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found." });
    });

    it("should return 500 on a service error", async () => {
      const req = createAuthenticatedRequest(
        AUTHENTICATED_USER_ID,
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      mockUserService.findUserById.mockRejectedValue(
        new Error("DB connection failed")
      );

      await handleGetUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "An error occurred while retrieving the user.",
      });
    });
  });

  describe("handleUpdate", () => {
    it("should return 200 and the updated user data on success", async () => {
      const req = createAuthenticatedRequest(
        AUTHENTICATED_USER_ID,
        AUTHENTICATED_USER_ID,
        MOCK_UPDATE_DATA
      );
      const res = mockResponse();

      mockUserService.updateUser.mockResolvedValue({
        ...MOCK_SAFE_USER,
        bio: MOCK_UPDATE_DATA.bio,
      } as SafeUser);

      await handleUpdate(req, res);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: AUTHENTICATED_USER_ID,
          firstName: MOCK_UPDATE_DATA.firstName,
          bio: MOCK_UPDATE_DATA.bio,
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User updated successfully." })
      );
    });

    it("should return 403 if the authenticated user tries to update another user", async () => {
      const req = createAuthenticatedRequest(
        OTHER_USER_ID,
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      await handleUpdate(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Access denied. You can only update your own account.",
      });
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
    });

    it("should return 404 if the user to update is not found by the service", async () => {
      const req = createAuthenticatedRequest(
        AUTHENTICATED_USER_ID,
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      mockUserService.updateUser.mockResolvedValue(null);

      await handleUpdate(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found." });
    });

    it("should return 500 on a service error", async () => {
      const req = createAuthenticatedRequest(
        AUTHENTICATED_USER_ID,
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      mockUserService.updateUser.mockRejectedValue(
        new Error("Validation failed")
      );

      await handleUpdate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "An error occurred while updating the user.",
      });
    });
  });

  describe("handleDelete", () => {
    it("should return 200 and success message on successful deletion", async () => {
      const req = createAuthenticatedRequest(
        AUTHENTICATED_USER_ID,
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      mockUserService.deleteUser.mockResolvedValue(true);

      await handleDelete(req, res);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(
        AUTHENTICATED_USER_ID
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User account deleted successfully.",
      });
    });

    it("should return 403 if the authenticated user tries to delete another user", async () => {
      const req = createAuthenticatedRequest(
        OTHER_USER_ID,
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      await handleDelete(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "Access denied. You can only delete your own account.",
      });
      expect(mockUserService.deleteUser).not.toHaveBeenCalled();
    });

    it("should return 500 if the service throws an error (e.g., user not found in service)", async () => {
      const req = createAuthenticatedRequest(
        AUTHENTICATED_USER_ID,
        AUTHENTICATED_USER_ID
      );
      const res = mockResponse();

      mockUserService.deleteUser.mockRejectedValue(
        new Error("User does not exist")
      );

      await handleDelete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "An error occurred while deleting the user.",
      });
    });
  });
});
