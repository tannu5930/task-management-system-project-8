import Board from '../models/board.model.js';
import BoardInvitation from '../models/boardInvitation.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';

export const createBoard = async (req, res) => {
  const { name, description, isPublic } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Board name is required' });
  }

  try {
    const board = new Board({
      name,
      description: description || '',
      owner: req.userId,
      isPublic: isPublic || false,
      members: [{
        user: req.userId,
        role: 'owner',
        joinedAt: new Date(),
      }],
    });

    const savedBoard = await board.save();
    await savedBoard.populate('owner', 'name email avatar');
    await savedBoard.populate('members.user', 'name email avatar');

    res.status(201).json(savedBoard);
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ message: 'Error creating board' });
  }
};

export const getUserBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.userId },
        { 'members.user': req.userId },
      ],
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ message: 'Error fetching boards' });
  }
};

export const getBoard = async (req, res) => {
  const { boardId } = req.params;

  try {
    const board = await Board.findById(boardId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isMember = board.members.some(member =>
      member.user._id.toString() === req.userId.toString()
    );
    const isOwner = board.owner._id.toString() === req.userId.toString();

    if (!isMember && !isOwner && !board.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(board);
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ message: 'Error fetching board' });
  }
};

export const inviteUserToBoard = async (req, res) => {
  const { boardId } = req.params;
  const { email, role, message } = req.body;

  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const memberRole = board.members.find(member =>
      member.user.toString() === req.userId.toString()
    )?.role;
    const isOwner = board.owner.toString() === req.userId.toString();

    if (!isOwner && memberRole !== 'admin') {
      return res.status(403).json({ message: 'Only board owners and admins can invite users' });
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isAlreadyMember = board.members.some(member =>
      member.user.toString() === userToInvite._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this board' });
    }

    const existingInvitation = await BoardInvitation.findOne({
      board: boardId,
      invitedUser: userToInvite._id,
      status: 'pending',
    });
    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent' });
    }

    const invitation = new BoardInvitation({
      board: boardId,
      invitedBy: req.userId,
      invitedUser: userToInvite._id,
      role: role || 'member',
      message: message || '',
    });

    await invitation.save();

    const notification = new Notification({
      user: userToInvite._id,
      type: 'board_invitation',
      title: 'Board Invitation',
      message: `You have been invited to join "${board.name}"`,
      data: {
        boardId: board._id,
        userId: req.userId,
      },
    });
    await notification.save();

    res.status(201).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Error sending invitation' });
  }
};

export const acceptInvitation = async (req, res) => {
  const { invitationId } = req.params;

  try {
    const invitation = await BoardInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.invitedUser.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation is no longer valid' });
    }

    const board = await Board.findById(invitation.board);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    board.members.push({
      user: req.userId,
      role: invitation.role,
      joinedAt: new Date(),
    });

    await board.save();

    invitation.status = 'accepted';
    await invitation.save();

    const notification = new Notification({
      user: board.owner,
      type: 'board_member_joined',
      title: 'New Board Member',
      message: `${req.user.name} joined "${board.name}"`,
      data: {
        boardId: board._id,
        userId: req.userId,
      },
    });
    await notification.save();

    res.status(200).json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Error accepting invitation' });
  }
};

export const declineInvitation = async (req, res) => {
  const { invitationId } = req.params;

  try {
    const invitation = await BoardInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.invitedUser.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    invitation.status = 'declined';
    await invitation.save();

    res.status(200).json({ message: 'Invitation declined' });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ message: 'Error declining invitation' });
  }
};

export const getUserInvitations = async (req, res) => {
  try {
    const invitations = await BoardInvitation.find({
      invitedUser: req.userId,
      status: 'pending',
    })
      .populate('board', 'name description')
      .populate('invitedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Error fetching invitations' });
  }
};
