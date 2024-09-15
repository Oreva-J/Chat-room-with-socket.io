const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');


const app = express();
const server = http.createServer(app)
const io = socketio(server)


// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'ChatCord Bot';

//runs when a client connect
io.on('connection', socket => {

    socket.on('joinRoom', ({username, room}) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
            
        // Wellcome current user.  |  //  broadcast to single user
        socket.emit('message', formatMessage(botName, 'welcome to LiveChat!'));

        // Beoadcast to others but user when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        // send users and rom info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

     // listen for chatMessage
     socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
        
     });

      //  Runs when Client disconnect
    socket.on('disconnect', ()=>{
        user = userLeave(socket.id)

        if(user){
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        };
        
         // send users and rom info
         io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Broadcast to everyone in general
    // io.emit()
});



const PORT = 3000 || process.env.PORT;

server.listen(PORT, ()=> console.log(`server running on PORT ${PORT}`));