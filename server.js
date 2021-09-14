var express = require('express');
var app = express();
var path = require('path');
let io = require('socket.io')(server);
let stream = require('./public/js/stream');
let favicon = require('serve-favicon');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname + '/public/favicon.ico'));
var server = require('http').Server(app);
server.listen(3001)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.of('/stream').on('connection', stream);