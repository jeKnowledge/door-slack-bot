var express    = require('express');
var bodyParser = require('body-parser');
var gpio       = require('gpio');
var fs         = require('fs');

var app = express();
var port = 3000; // same port as ngrok

// number of milliseconds elapsed since 1 January 1970 
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
		
		OnDoorCall();
		
		// checks if button was pressed in 60ms intervals
		firstButtonPressCheck = setInterval(function(){
			if(gpio27.value == 1){ 
				clearInterval(firstButtonPressCheck);
				
				OnFirstButtonPress();
		
				// checks if button was released in 60ms intervals
				firstButtonReleaseCheck = setInterval(function(){
					if(gpio27.value == 0){
						clearInterval(firstButtonReleaseCheck);

						// at this time, the user should be on his way to get the door

						secondButtonPressCheck = setInterval(function(){
							if(gpio27.value == 1){
								clearInterval(secondButtonPressCheck);

								OnSecondButtonPress();

								var botPayload = makePayload();

								// checks if button was released in 60ms intervals
								firstButtonReleaseCheck = setInterval(function(){
									if(gpio27.value == 0){
										clearInterval(firstButtonReleaseCheck);

										// send message to slack
										return res.status(200).json(botPayload);
									}
								},60);
							}
						},60);
					}
				},60);
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

function OnDoorCall(){
	// Green ON
	gpio17.set(1); 
	console.log("green on!");

}

function OnFirstButtonPress(){

	console.log("First utton press!");

	// Green OFF
	gpio17.set(0);
	console.log("green off!");

	// start the timer
	startTime = getTime();
	console.log("start time = " + startTime);

}

function OnSecondButtonPress(){
	// stop the timer
	endTime = getTime();
	console.log("end time = " + endTime);
}

var makePayload = function(){
	// get diff time inseconds
	var deltaTime = (endTime - startTime)/1000; 
	startTime = 0;
	endTime = 0;
	var timeString = getTimeString(deltaTime);
	var payLoad = {
		text: "Conseguiste um tempo de " + timeString + "!"
	}

}

function getTime(){
	var date = Date.now();
	return (date);
}

var getTimeString = function(deltaTime){
	var horas = 0;
	var minutos = 0;
	var segundos = 0;
	var string = "";
	while(deltaTime >= (3600)){
		horas++;
		deltaTime -= 3600;
	}
	while(deltaTime >= 60){
		minutos++;
		deltaTime -= 60;
	}
	if(horas > 0)
		string = horas + " horas, ";
	string = string + minutos + " minutos e " + segundos + " segundos";
	return string;
}