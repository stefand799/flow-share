import request from "supertest";
import express, { Router, Request, Response, NextFunction } from "express";

import groupRouter from "../../src/routes/group-routes";

jest.mock("../../src/controllers/group-controller", () => ({
  handleCreate: jest.fn((req, res) => res.status(201).send("CREATE_OK")),
  handleGetAll: jest.fn((req, res) => res.status(200).send("GET_ALL_OK")),
  handleGetGroup: jest.fn((req, res) => res.status(200).send("GET_GROUP_OK")),
  handleUpdate: jest.fn((req, res) => res.status(200).send("UPDATE_OK")),
  handleDelete: jest.fn((req, res) => res.status(200).send("DELETE_OK")),
}));
const mockGroupController = require("../../src/controllers/group-controller");

jest.mock("../../src/middleware/auth-middleware", () => {
  const mockAuthenticate = jest.fn(
    (req: Request, res: Response, next: NextFunction) => next()
  );
  return {
    authenticate: mockAuthenticate,
  };
});
const mockAuthenticate =
  require("../../src/middleware/auth-middleware").authenticate;

const app = express();
app.use(express.json());
app.use("/", groupRouter);

const GROUP_ID = 5;
const AUTH_DENIED_TEXT = "ACCESS DENIED";

describe("Group Router (/ - base)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticate.mockImplementation(
      (req: Request, res: Response, next: NextFunction) => next()
    );
  });

  const mockMiddlewareFailure = () => {
    mockAuthenticate.mockImplementationOnce(
      (req: Request, res: Response, next: NextFunction) => {
        res.status(403).send(AUTH_DENIED_TEXT);
      }
    );
  };

  describe("POST /", () => {
    it("should route POST / through authenticate and to handleCreate on success", async () => {
      const response = await request(app).post("/").send({ name: "New Group" });

      expect(mockAuthenticate).toHaveBeenCalledTimes(1);
      expect(mockGroupController.handleCreate).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(201);
      expect(response.text).toBe("CREATE_OK");
    });

    it("should block POST request if authenticate middleware fails", async () => {
      mockMiddlewareFailure();
      const response = await request(app).post("/").send({ name: "New Group" });

      expect(response.status).toBe(403);
      expect(response.text).toBe(AUTH_DENIED_TEXT);
      expect(mockGroupController.handleCreate).not.toHaveBeenCalled();
    });
  });

  describe("GET /", () => {
    it("should route GET / through authenticate and to handleGetAll on success", async () => {
      const response = await request(app).get("/");

      expect(mockAuthenticate).toHaveBeenCalledTimes(1);
      expect(mockGroupController.handleGetAll).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(response.text).toBe("GET_ALL_OK");
    });

    it("should block GET request if authenticate middleware fails", async () => {
      mockMiddlewareFailure();
      const response = await request(app).get("/");

      expect(response.status).toBe(403);
      expect(response.text).toBe(AUTH_DENIED_TEXT);
      expect(mockGroupController.handleGetAll).not.toHaveBeenCalled();
    });
  });

  describe("GET /:groupId", () => {
    it("should route GET /:groupId through authenticate and to handleGetGroup on success", async () => {
      const response = await request(app).get(`/${GROUP_ID}`);

      expect(mockAuthenticate).toHaveBeenCalledTimes(1);
      expect(mockGroupController.handleGetGroup).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(response.text).toBe("GET_GROUP_OK");
    });
  });

  describe("PUT /:groupId", () => {
    it("should route PUT /:groupId through authenticate and to handleUpdate on success", async () => {
      const response = await request(app)
        .put(`/${GROUP_ID}`)
        .send({ description: "New Description" });

      expect(mockAuthenticate).toHaveBeenCalledTimes(1);
      expect(mockGroupController.handleUpdate).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(response.text).toBe("UPDATE_OK");
    });
  });

  describe("DELETE /:groupId", () => {
    it("should route DELETE /:groupId through authenticate and to handleDelete on success", async () => {
      const response = await request(app).delete(`/${GROUP_ID}`);

      expect(mockAuthenticate).toHaveBeenCalledTimes(1);
      expect(mockGroupController.handleDelete).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(response.text).toBe("DELETE_OK");
    });
  });
});
