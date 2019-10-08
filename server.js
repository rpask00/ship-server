const express = require('express');
const socketPackage = require('socket.io');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const path = require('path')
const port = process.env.PORT || 3000;
// App setup
const app = express();
let server = app.listen(port, () => {
    console.log('Listening at ' + port)
})

app.use(express.static('public'))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))


// Socket setup
let io = socketPackage(server)

function getSocketsKeys(sockets) {
    let keys = [];
    for (let key in sockets)
        keys.push(key);
    return keys
}

io.on('connection', (socket) => {
    io.sockets.emit('keys-share', { keys: getSocketsKeys(io.sockets.connected) })


    socket.on('creating-connection', data => {
        socket.emit('me', { mySocket: socket.id })
        io.sockets.emit('keys-share', { keys: getSocketsKeys(io.sockets.connected) })
    })

    socket.on('disconnect', data => {
        io.sockets.emit('keys-share', { keys: getSocketsKeys(io.sockets.connected) })
    })

    socket.on('invite', data => {
        io.sockets.sockets[data.addressee].emit('invitation', data)
    })

    socket.on('reject', data => {
        io.sockets.sockets[data.me].emit('invitation', null)
    })

    socket.on('accept', data => {
        let whoBegin = (Math.random() > .5);

        io.sockets.sockets[data.sender].emit('onAccept', data)
        io.sockets.sockets[data.sender].emit('game-begin', whoBegin ? 1 : 2)
        io.sockets.sockets[data.addressee].emit('game-begin', !whoBegin ? 1 : 2)
    })

    socket.on('place-hit', data => {
        if (data.defender)
            io.sockets.sockets[data.defender].emit('get-hit', data.cordsToDelete)
    })

    socket.on('game-over', data => {
        console.log(data)
        io.sockets.sockets[data].emit('you-won', data)
    })


})

// git add .
// git commit -am "make it better"
// git push heroku master