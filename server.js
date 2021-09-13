var express = require('express');
var app = express();
var path = require('path');
app.use('/public', express.static(path.join( __dirname, 'public')));
var server = require('http').Server(app);
server.listen(3001)

app.get('/', (req, res) => {
    res.sendFile( __dirname + '/index.html');
});