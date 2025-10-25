// File: routes/group-routes.ts

import { Router } from "express";
import * as GroupController from "../controllers/group-controller";
import { authenticate } from "../middleware/auth-middleware";
// Suggested Authorization Middleware (PLACEHOLDERS)
// import { isGroupAdmin } from "../middleware/group-auth-middleware"; 

const router = Router();

// Routes requiring Group Admin or Owner role for security
// Rationale: Only an admin should create, update, or delete a group.

// POST /api/groups/create
router.post("/create", authenticate, /* isGroupAdmin (or self-check) */ GroupController.handleCreate);

// PUT /api/groups/:groupId - Use route parameter for the group ID
router.put("/:groupId", authenticate, /* isGroupAdmin */ GroupController.handleUpdate);

// DELETE /api/groups/:groupId - Use route parameter for the group ID
router.delete("/:groupId", authenticate, /* isGroupAdmin */ GroupController.handleDelete);

// Routes requiring Group Admin role to manage membership
// Promote, Demote, and Remove now use a route parameter for the GroupMember ID
// PUT /api/groups/promote/:memberId
router.put("/promote-admin/:memberId", authenticate, /* isGroupAdmin */ GroupController.handlePromoteAdmin);

// PUT /api/groups/demote/:memberId
router.put("/demote-admin/:memberId", authenticate, /* isGroupAdmin */ GroupController.handleDemoteAdmin);

// DELETE /api/groups/remove-member/:memberId (Better to use memberId here)
router.delete("/remove-member/:memberId", authenticate, /* isGroupAdmin (or self-removal) */ GroupController.handleRemoveMember);

// POST /api/groups/add-member (User ID to add is in the body, Group ID can be in the body or URL, keep in body for simplicity)
router.post("/add-member", authenticate, /* isGroupAdmin */ GroupController.handleAddMember);


// Routes requiring only Authentication (and/or Group Membership)
// GET /api/groups/get-all (current user's groups)
router.get("/get-all", authenticate, GroupController.handleGetAll);

// GET /api/groups/:groupId/members - RESTful way to get a resource's sub-resource
router.get("/:groupId/members", authenticate, /* isGroupMember (optional) */ GroupController.handleGetMembers); 

export default router;