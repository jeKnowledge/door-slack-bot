var express    = require('express');
var bodyParser = require('body-parser');
var gpio       = require('gpio');
var fs         = require('fs');

var app = express();
var port = 3000; // same port as ngrok

var startTime = 0; // when the user is notified
var endTime = 0;  // when the user returns from opening the door

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res) {
	res.status(200).send('Hello World!\n');
});

app.listen(port, function(){
	console.log('Listening on port ' + port);
});

//===========================================================

app.post('/', function(req, res, next){
	var userName = req.body.user_name;
	
	// make sure there are no message loops, and only one user is being timed
	if(userName === 'slackbot' || userName === 'Door' || startTime != 0){
		console.log("YOU SHALL NOT PASS!\n");
		return res.status(200).end();
	} else {
		// Turn on red LED (TODO: and sound buzzer for a limited time?/untill button press?)
		start();
		
		refreshTimer = setInterval(function(){
			if(gpio27.value == 1){
				console.log("Button press!");
				clearInterval(refreshTimer);
			
				// desliga verde
				gpio17.set(0);
				console.log("green off!");
		
		
				endTime = getTime();
				console.log("end time = " + endTime);
				
				var difTime = (endTime - startTime)/1000;
				startTime = 0;
				endTime = 0;
				console.log("Diff time = " + difTime);
		
				var botPayload = {
					text: 'The time was ' + difTime
				};
				return res.status(200).json(botPayload);
			}
		},60);
	}
			
});

// flashing lights if led is on GPIO4
//green led
var gpio4 = gpio.export(4, {
	direction: 'out',
	interval: 200,
	ready: function(){
		intervalTimer = setInterval(function() { 
			gpio4.set();
			setTimeout(function() { gpio4.reset(); },500);
		},500);
	}
});

// red led
var gpio17 = gpio.export(17, {
	direction: 'out',
	interval: 200,
	ready: function(){
		gpio17.reset();
	}
}); 

// button
var gpio27 = gpio.export(27, {
	direction: 'in',
	interval: 200
});

function startEvent(){
	// turn on red LED
	gpio17.set(1); 
	console.log("green on!");

	// start the timer
	startTime = getTime();
	console.log("start time = " + startTime);
}



function getTime(){
	var date = Date.now();
	return (date);
}