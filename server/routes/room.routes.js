const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { Message, User } = require('../models');
const {
    createRoom, 
    joinRoom,
    getMyRooms,
    getRoomById,
    closeRoom,
} = require('../controllers/room.controller');

router.use(protect); //router.use(protect) applies the auth middleware to every route in this file at once — cleaner than adding protect to each route individually.

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/my-rooms', getMyRooms);
router.get('/:id', getRoomById);
router.get('/:id/messages', async(req, res)=>{
    try{
        const messages = await Message.findAll({//Fetches all messages from DB.
            where: {room_id: req.params.id},//Only fetch messages belonging to this room.
            include: [{model: User, as: 'sender', attributes: ['id','name','avatar_url']}], //This performs a JOIN with the User table.
            order: [['createdAt', 'ASC']],
            limit: 100,
        });

        const formatted = messages.map((m)=>({ //Transforms DB records into frontend-friendly JSON.
            senderId: m.sender_id,
            senderName: m.sender?.name,
            message: m.content,
            timestamp: m.createdAt,
        }));
        res.json({messages: formatted});
    }catch(err){
        res.status(500).json({message: 'Failed to fetch messages.'});
    }
});
router.patch('/:id/close', closeRoom);

module.exports = router;