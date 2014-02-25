function get_distance(x1, y1, x2, y2){
	/* Given four points, return the distance between them */ 

	return Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

}

function Sonar(canvas){

	this.canvas = canvas;
	this.context = this.canvas.getContext("2d");

	this.borderx = 20;
	this.bordery = 20;

	this.framerate = 30;

	this.update_interval_id;

	this.my_geoloc;
	this.other_geoloc = [];

	this.debug = true;
	
	if(this.debug){
		this.test_geolocs = [
					{"latitude" : 43.600657, "longitude" :-79.645042},	
					{"latitude" : 43.577779, "longitude" :-79.595261},
					{"latitude" : 43.517933, "longitude" :-79.66753 },
					{"latitude" : 43.598544, "longitude" :-79.692249}
				];
		this.other_geoloc = this.test_geolocs;
	}

	this.compass_smooth = 0; //Max degree change ignored by compass.

	this.current_rotation = 0;
	this.degrees_from_north = 0;
	this.compass_turn_increment = 2;
	this.compass_sensitivity = 5;

	this.points_to_render = [];
	
	this.min_max_range = 1/111; //Max geodistance from my_geoloc to render points.

	this.delta_time; //In ms, updated at the start of every update()
	this.curr_time;
	this.prev_time;

	this.ping_start_time; //Timestamp for start of ping. 
	this.ping_duration = 1000;
	this.ping_wait = 500;
	
	this.init();

}

Sonar.prototype.init = function(){
	/* Constructor */
	
	this.curr_time = (new Date()).getTime();
	this.ping_start_time = this.curr_time;

	//For testing: Default geoloc is Square One (utm's gps);
	this.my_geoloc = {"latitude":43.548128, "longitude":-79.661672};

	this.get_points_to_render();

	this.update_on_canvas_rescale();

	//Set compass event.
	this.init_compass();

	//Set update interval.
	var t = this;
	this.update_interval_id = 
		setInterval( function(){ 
			t.update(); 
		}, 1000/this.framerate);
	this.update();

	var t = this;
	setInterval(function(){
			t.pull();
	}, 1000);
}

Sonar.prototype.init_compass = function(){

	/*
	if (window.DeviceMotionEvent){
		window.addEventListener('devicemotion', function(event){
		}, false);
	} */


	var t = this;
	
	if(window.DeviceOrientationEvent){
		//Chrome support:
		window.addEventListener('deviceorientation', 
			function(event){
				t.onOrientationUpdate(event)
			}, false);
	}
}

Sonar.prototype.onOrientationUpdate = function(event){
	//Change degrees, but ignore small changes.
	
	
	//Note: Top of the screen is right when held in hand.
	//In this case, we add 90 to the alpha.

	if (event.alpha != null){
		var alpha = event.alpha + 90;	
	}
	else if(event.webkitCompassHeading != undefined){
		var alpha = 360 - event.webkitCompassHeading;
	}

	//With alpha, west is 90. This is conveniently what we want to rotate by.
	
	if (Math.abs(alpha - this.degrees_from_north) > this.compass_smooth ){
		this.degrees_from_north = alpha;
	}

}

Sonar.prototype.destroy = function(){
	/* Destructor */

	//Stop update interval.
	clearInterval(this.update_interval_id);
}

Sonar.prototype.get_points_to_render = function(){
	/* Uses my_geoloc, other_geoloc, canvas size and max range,
 	* Creates an array of points representing dots to be plotted on
 	* the canvas, for the sonar */

	var points = [];

	//Maxrange default -1 (largest dist is farthest point)
	var max_range = this.min_max_range;	
	var max_range_point = {};

	//Center points around my_geoloc (0, 0)
	points.push({"x": 0, "y" : 0});
	for (var i = 0; i < this.other_geoloc.length; i++){
	
		//Add the point to our array.
		var other_geoloc_x = this.other_geoloc[i]["longitude"] 
								- this.my_geoloc["longitude"];
		var other_geoloc_y = this.other_geoloc[i]["latitude"] 
								- this.my_geoloc["latitude"];
		points.push({"x":other_geoloc_x, "y":other_geoloc_y});		

		//Keep track of the farthest point.
		var distance = get_distance(
					this.my_geoloc["longitude"], this.my_geoloc["latitude"], 
					this.other_geoloc[i]["longitude"], this.other_geoloc[i]["latitude"]);

		if ( distance > max_range ){ 
			max_range = distance; 
		}
		
	}

	//Throw away all points that are past max_range
	//Only applies if max_range was not -1.
	
	//Plot points to % of max_range
	// pt = pt / max_range * (canvasxy / 2)	
	// Also move 0,0 to center of canvas, all points + canvasxy/2
	var points_scaled = [];

	for(var i = 0; i < points.length; i++){
		points_scaled.push({
			"x": (points[i]["x"] / max_range * this.canvasxy/2 + this.canvasxy/2),
			"y": (points[i]["y"] / max_range * this.canvasxy/2 + this.canvasxy/2)
		});

	}

	this.points_to_render = points_scaled;

}

Sonar.prototype.update = function(){
	/* Updates the Sonar image, clearing the canvas and redrawing 
 	*  all elements */

	//Calculate new delta time
	this.update_delta_time();

	//Restart ping if time elapsed.
	if (this.curr_time - this.ping_start_time > this.ping_duration + this.ping_wait){	
		this.get_points_to_render();
		this.reset_sonar();
	} 

	//Clear and reset the canvas.
	this.canvas.width = this.canvas.width;

	//Draw everything.

	//this.draw_background();	

	this.rotate(this.degrees_from_north); //Every draw after this is rotated.
	this.draw_ping_circle();
	this.draw_points();	
	this.draw_compass_north();
}

Sonar.prototype.update_on_canvas_rescale = function(){
	/* To be called when the canvas resizes, rescales the relevant variables */

	var canvasx = this.canvas.width - this.borderx;
	var canvasy = this.canvas.height - this.bordery;
	
	this.canvasxy = canvasx > canvasy ? canvasy : canvasx;
	this.canvasx = this.canvasxy;
	this.canvasy = this.canvasxy;

	//Remap the points to the new canvas.
	this.get_points_to_render();
	this.reset_sonar();
}

Sonar.prototype.reset_sonar = function(){
	/* Restarts the sonar image in preparation for the next ping */
	this.ping_start_time = this.curr_time;
}

Sonar.prototype.draw_background = function(){
	/* Draws the sonar background */

	//Set up the colors.
	this.context.strokeStyle = 'rgba(0, 255, 0, 1)';
	this.context.fillStyle = 'rgba(0, 255, 0, 0.5)';
	this.context.lineWidth = 3;	

	//Draw the border.
	this.context.beginPath();	
	this.context.rect(0, 0, this.canvasx, this.canvasy);
	this.context.stroke();
	this.context.fill();
	this.context.closePath();

	//Draw the circle.	
	this.context.beginPath();	
	this.context.arc(this.canvasx/2, this.canvasy/2,
		this.canvasxy/2, 0, 2 * Math.PI, false);
	this.context.stroke();
	this.context.fill();
	this.context.closePath();

	//Draw guide circles.
	this.context.strokeStyle = 'rgba(0, 210, 0, 1)';
	for(var i in r = [1, 3, 5, 7, 9]){
		this.context.beginPath();
		this.context.arc(this.canvasx/2, this.canvasy/2,
			this.canvasxy/22 * r[i], 0, 2 * Math.PI, false);
		this.context.stroke();
		this.context.closePath();
	}

}

Sonar.prototype.draw_ping_circle = function(){
	/* Draws the ping circle. */

	//Figure out % completion of the ping.
	var percent_completion = (this.curr_time - this.ping_start_time) 
									/ this.ping_duration; 
	if(percent_completion > 1){percent_completion = 1;}

	//Draw the circle.	
	this.context.strokeStyle = 'rgba(0, 255, 0, 1)';
	this.context.lineWidth = this.canvasxy / 100;
	
	this.context.beginPath();	
	this.context.arc(this.canvasx/2, this.canvasy/2,
		this.canvasxy/2 * percent_completion, 0, 2 * Math.PI, false);
	this.context.stroke();
	this.context.closePath();
	

}

Sonar.prototype.draw_points = function(){
	/* Goes through the list of points and draws them. */
	
	//Figure out % distance from center for points to be rendered.
	var percent_completion = (this.curr_time - this.ping_start_time) 
									/ this.ping_duration; 
	if(percent_completion > 1){percent_completion = 1;}
	
	//Set up the color of the points.
	this.context.strokeStyle = 'rgba(128, 255, 128, 1)';
	this.context.fillStyle = 'rgba(255, 0, 0, 1)';
	this.context.lineWidth = this.canvasxy / 50;	
	var radius = 2;
	
	for (var i = 0; i < this.points_to_render.length; i++){
		var point = this.points_to_render[i];
		
		//Figure out distance to center of sonar display.
		var distance_to_center = get_distance(this.canvasx/2, 
				this.canvasy/2, point['x'], point['y']);

		if (distance_to_center -1<= (this.canvasxy / 2) * percent_completion){
			
			//Render the point.
		
			this.context.beginPath();	
			this.context.arc(point['x'], point['y'], radius, 0, 2 * Math.PI, false);
			this.context.stroke();
			this.context.fill();
			this.context.closePath();
			
				
		}  
	}	

}

Sonar.prototype.draw_compass_north = function(){
	/* Draw the north symbol at the top of the circle */

	this.context.strokeStyle = 'rgba(50, 50, 255, 1)';
	this.context.lineWidth = this.canvasxy / 50;

	this.context.beginPath();
	
	var x = this.canvasx / 2;
	var y = 10;
	
	var w = this.canvasx / 50;
	var h = this.canvasy / 50;

	this.context.moveTo(x - w, y + (h + 2));
	this.context.lineTo(x - w, y - h);
	this.context.lineTo(x + w, y + h);
	this.context.lineTo(x + w, y - (h + 2) );

	this.context.stroke();
	this.context.closePath();
}

Sonar.prototype.rotate = function(degrees){

	//Window orientation fix.
	//if(navigator.userAgent.indexOf('Chrome') != -1){
			if(window.orientation){
				if(window.orientation == -90){
					degrees -= 270;
				}
				else{
					degrees -= window.orientation;
				}
				if(degrees < 0){ degrees += 360};
			}
	//}

	if (this.current_rotation + this.compass_sensitivity < degrees){
		this.current_rotation += this.compass_turn_increment;
	}
	else if (this.current_rotation - this.compass_sensitivity > degrees){
		this.current_rotation -= this.compass_turn_increment;
	}

	this.context.translate(this.canvasx/2, this.canvasy/2);
	this.context.rotate(Math.floor(this.current_rotation) * Math.PI / 180)
	this.context.translate(-this.canvasx/2, -this.canvasy/2);
}

Sonar.prototype.update_delta_time = function(){
	/* Updates the time since last update */

	this.prev_time = this.curr_time;

	this.curr_time = (new Date()).getTime();
	this.delta_time = this.prev_time - this.curr_time;
	
}

Sonar.prototype.pull = function(){

	var t = this;
	var request = $.ajax({
		url: 'php/gps.php',
		type: 'GET',
	});
	request.done(function(json_data){
		try {
			t.other_geoloc = $.parseJSON(json_data);
			t.other_geoloc = t.other_geoloc.concat(t.test_geolocs);
	    } catch (err) {
	        console.log('Exception: ' + err.message);
	    }
	});

	request.fail(function(jqXHR, error){
		console.log('GPS GET error: ' + error);
	});
}
