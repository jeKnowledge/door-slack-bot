var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();
var port = process.env.PORT || 1337;

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function(req, res) {
    console.log('GET /');

    res.status(200).send('Door');
});

var pickRandom = function(department) {
    var members = JSON.parse(fs.readFileSync('members/' + department + '.json', 'utf8'));
    return members[Math.floor(Math.random() * members.length)];
};

app.post('/random/:department', function(req, res, next) {
    console.log("POST /random");
    var username = pickRandom(req.params.department);
    var botPayload = {
        text: '@' + username + ', é a tua vez de abrir a porta :grin:'
    };
    return res.status(200).json(botPayload);
});

app.post('/door', function(req, res, next) {
    console.log("POST /door");

    var username = req.body.user_name;
    var botPayload = {
        text: username + ' pede para abrirem a :door:'
    };

    return res.status(200).json(botPayload);
});

app.listen(port, function() {
    console.log('Listening on port ' + port);
});
