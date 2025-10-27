import { Router } from "express";
import * as MemberController from "../controllers/member-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

// RESTful Group Member Routes

// GET /api/members/group/:groupId - Get all members of a group
router.get("/group/:groupId", authenticate, MemberController.handleGetMembers);

// POST /api/members - Add a member to a group (by userId)
router.post("/", authenticate, MemberController.handleAddMember);

// POST /api/members/group/:groupId/add-by-username - Add member by username
router.post("/group/:groupId/add-by-username", authenticate, MemberController.handleAddMemberByUsername);

// DELETE /api/members/:memberId - Remove a member from a group
router.delete("/:memberId", authenticate, MemberController.handleRemoveMember);

// PUT /api/members/:memberId/promote - Promote member to admin
router.put("/:memberId/promote", authenticate, MemberController.handlePromoteAdmin);

// PUT /api/members/:memberId/demote - Demote admin to regular member
router.put("/:memberId/demote", authenticate, MemberController.handleDemoteAdmin);

export default router;