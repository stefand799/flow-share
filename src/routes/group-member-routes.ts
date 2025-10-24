import { Router } from "express";
import * as GroupMemberController from "../controllers/group-member-controller";
import { authenticate } from "../middleware/auth-middleware";

const router = Router();

router.get("/group/:groupId", authenticate, GroupMemberController.handleGetMembers);

router.post("/", authenticate, GroupMemberController.handleAddMember);

router.post("/group/:groupId/add-by-username", authenticate, GroupMemberController.handleAddMemberByUsername);

router.delete("/:groupMemberId", authenticate, GroupMemberController.handleRemoveMember);

router.put("/:groupMemberId/promote", authenticate, GroupMemberController.handlePromoteAdmin);

router.put("/:groupMemberId/demote", authenticate, GroupMemberController.handleDemoteAdmin);

export default router;