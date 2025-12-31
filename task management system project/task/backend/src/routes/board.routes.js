import express from 'express';
import {
  createBoard,
  getUserBoards,
  getBoard,
  inviteUserToBoard,
  acceptInvitation,
  declineInvitation,
  getUserInvitations,
} from '../controllers/board.controller.js';
import { authCheck } from '../middleware/authCheck.js';

const router = express.Router();

router.use(authCheck);

router.post('/', createBoard);
router.get('/', getUserBoards);
router.get('/:boardId', getBoard);

router.post('/:boardId/invite', inviteUserToBoard);
router.get('/invitations', getUserInvitations);
router.post('/invitations/:invitationId/accept', acceptInvitation);
router.post('/invitations/:invitationId/decline', declineInvitation);

export default router;