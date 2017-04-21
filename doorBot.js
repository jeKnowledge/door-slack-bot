var express    = require('express');
var bodyParser = require('body-parser');
var gpio       = require('gpio');
var Slack      = require('slack-node');
var fs         = require('fs');

var app = express();
slack = new Slack();
var port = 3000; // same port as ngrok

// number of milliseconds elapsed since 1 January 1970 
var startTime = 0; // when the user is notified
var endTime   = 0; // when the user returns from opening the door

var messageLink = process.env.LINK;
var token       = process.env.TOKEN;

slack.setWebhook(messageLink);

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res) {
  res.status(200).send('Hello World!\n');
});

app.listen(port, function(){
  console.log('Listening on port ' + port);
  console.log(messageLink);
});



//===========================================================

app.post('/', function(req, res, next){
  var userName = req.body.user_name;
  var tok = req.body.token;		
  // make sure there are no message loops, and only one user is being timed
  if(userName === 'slackbot' || userName === 'Door' || startTime != 0 || tok !== token){
    console.log('YOU SHALL NOT PASS!\n');
    console.log(tok);
    console.log(token);
    return res.status(200).end();
  } else {
    // Turn on red LED (TODO: sound buzzer)
    OnDoorCall();
  	
    // checks if button was pressed in 60ms intervals
    firstButtonPressCheck = setInterval(function() {
      if (gpio27.value == 1) { 
        clearInterval(firstButtonPressCheck);
  			
        OnFirstButtonPress();
  	
        // checks if button was released in 60ms intervals
        firstButtonReleaseCheck = setInterval(function() {
          if (gpio27.value == 0) {
            clearInterval(firstButtonReleaseCheck);
            console.log('Button release');
            // at this time, the user should be on his way to get the door
            sendMessage('ON MY WAY!');
            secondButtonPressCheck = setInterval(function() {
              if (gpio27.value == 1) {
                clearInterval(secondButtonPressCheck);  
                OnSecondButtonPress();  
                var deltaTime = getDeltaTime();
                var timeString = getTimeString(deltaTime);
  
                var botPayLoad = {
                  text: 'Conseguiste um tempo de ' + timeString + '!'
                }

                // checks if button was released in 60ms intervals
                secondButtonReleaseCheck = setInterval(function() {
                  if (gpio27.value == 0) {
                    clearInterval(secondButtonReleaseCheck);
                    console.log('Second release\n');
                    // send message to slack
                    return res.status(200).json(botPayLoad);
                  }
                },60);
              }
            },10);
          }
        },60);
      }
    },10);
  }	
});


function sendMessage(bodyText) {
  slack.webhook({
    //channel:'#random',
    username:'THE BOT',
    text:bodyText
  }, function(err, response) {
    //console.log(response);
  });
}

// flashing lights if led is on GPIO4
//green led
var gpio4 = gpio.export(4, {
  direction: 'out',
  interval: 200,
  ready: function(){
    intervalTimer = setInterval(function() { 
      gpio4.set();
      setTimeout(function() { 
        gpio4.reset(); 
      },500);
    },500);
  }
});

// red led
var gpio17 = gpio.export(17, {
  direction: 'out',
  interval: 200,
  ready: function() {
    gpio17.reset();
  }
}); 

// button
var gpio27 = gpio.export(27, {
  direction: 'in',
  interval: 200
});

function OnDoorCall(){
  // Green ON
  gpio17.set(1); 
  console.log('green on!');
}

function OnFirstButtonPress() {
  console.log('First button press!');

  // Green OFF
  gpio17.set(0);
  console.log('green off!');

  // start the timer
  startTime = getTime();
  console.log('start time = ' + startTime);
}

function OnSecondButtonPress() {

  console.log('Second button press!');

  // stop the timer
  endTime = getTime();
  console.log('end time = ' + endTime);
}

var getDeltaTime = function() {
  // get diff time inseconds
  var deltaTime = (endTime - startTime)/1000; 
  startTime = 0;
  endTime = 0;
  console.log(deltaTime);
  return deltaTime;
}

function getTime() {
  var date = Date.now();
  return (date);
}

var getTimeString = function(deltaT) {
  var horas = 0;
  var minutos = 0;
  var segundos = 0;
  var string = '';
  while (deltaT >= (3600)) {
    horas++;
    deltaT -= 3600;
  }

  while (deltaT >= 60) {
    minutos++;
    deltaT -= 60;
  }

  while (deltaT >= 1) {
    segundos++;
    deltaT-= 1;
  }

  if (horas > 0) {
    string = horas + ' hora';
    if (horas > 1)
      string = string + 's';

    string = string + ', ';
  }

  if (minutos > 0) {
    string = string + minutos + ' minuto';
    if (minutos > 1)
      string = string + 's';

    string = string + ' e ';
  }

  string = string + segundos + ' segundo';
    if (segundos > 1)
      string = string + 's';

  return string;
}
