function distance(x1, y1, x2, y2){
	/* Given four points, return the distance between them */ 

	return Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

}

function direction(x1, y1, x2, y2){
	/* Given two sets of points, return the radians from up (clockwise)
 	*  of the line between the points. */


	//return Math.atan(Math.abs( (x2 - x1) / (y2 - y1) ) );

	var a = Math.atan2(x2 - x1, y2 - y1);
	
	//atan2 goes from 0 to 180 going right, and 0 to -180 going left.
	//If it's negative, we correct to get from 0-360 (only in radians)
	a =  a < 0 ? 2 * Math.PI + a : a;

	return a;
}

function distance_travelled(t,v,a){
	/* Given an initial velocity, acceleration, and time to travel, 
	 * returns the distance travelled in that time */

	return (0.5 * a * t * t) + (v * t);
}

function component_distance(d, a){
	/* Given length d and radians from up a, returns the x and y
	 * of a line of length d and angle a.
	 * Return format: {"x":x_dist, "y":y_dist} */

	return {
		"x": Math.sin(a) * d,
		"y": Math.cos(a) * d
	}	
}

function Physics_manager(world){
 	/* The manager tracks and moves objects on every update until 
 	* they come to a stop based on acceleration. */

	this.world = world;
	this.acceleration = -10 / 1000; //pixels per ms
	this.max_velocity = 4; //pixels per ms

	this.objects = {};
	this.framerate = 60;

	var t = this;
	this.update_interval_id = setInterval( function(){
		t.update();
	}, 1000/this.framerate);
}

Physics_manager.prototype.add_object = function(id, angle, v1){

	/* Takes an object id, its initial position, its direction 
 	* of movement(in radians from up), and its initial velocity,
 	* and adds it to the manager.
 	*/

	var obj = $('#' + id);

	if (v1 > this.max_velocity){ v1 = this.max_velocity; };

	this.objects[id] = {
		"x1" : obj.position().left,
		"y1" : obj.position().top,
		"angle"  : angle,
		"v1" : v1, //pixels per ms
		"t1" : (new Date()).getTime()
	}
}

Physics_manager.prototype.update = function(){
	/* Updates the position of all the objects in the manager */

	for(var id in this.objects){

		var o = this.objects[id];
		var done = false;		

		//Calculate the delta time.
		var dt = (new Date()).getTime() - o["t1"];

		//Calculate the time at which the object stopped.
		//If we've passed it, set delta time to it.
		//If we've passed it, we can also remove the object once we're done.
		if( dt > Math.abs(o["v1"] / this.acceleration)){ 
			dt = Math.abs(o["v1"] / this.acceleration);
			done = true;			
		}

		var dist = distance_travelled(dt, o["v1"], this.acceleration);
		var cdist = component_distance(dist, o["angle"])

		//TODO: Make sure this works, y to top.
		//console.log("  cdistx: " + (cdist["x"]) + " cdisty: " + (cdist["y"]));
		
		var x = o["x1"] + cdist["x"];
		var y = o["y1"] + cdist["y"];
		//console.log(o["angle"] / Math.PI * 180);

		//Borders and bounces

		var img = $('#' + id);			

		var min_x = this.world.offset().left;
		var min_y = this.world.offset().top;	
		var max_x = min_x + this.world.width() -img.width();
		var max_y = min_y + this.world.height() - img.height();

		if (x < min_x){ x = min_x;}
		if (x > max_x){ x = max_x;}	
		if (y < min_y){ y = min_y;}
		if (y > max_y){ y = max_y;}
		
		$('#'+id).css({left: x, top: y});
		push(id);		
		if(done){ push(id); delete(this.objects[id]); lock=null; }
	}

}

function Movement_manager(world){

	this.current_object;
	this.positions = [];

	this.physics = new Physics_manager(world);

	this.slide_threshold = 200; //ms of non-motion

}

Movement_manager.prototype.onDragStart = function(event){

	var id = event.target.id;

	this.current_object = $('#'+id); 
	this.positions.length = 0;

	this.record_object_position();
}

Movement_manager.prototype.onDrag = function(event){

	this.record_object_position();
	event.stopImmediatePropagation();
}

Movement_manager.prototype.onDragStop = function(event){

	this.record_object_position();

	this.fix_bounds();

	//Check the last few positions to determine velocity and direction.
	//If velocity exceeds threshold, add it to the physics manager.

	var check_interval = 3;

	if(this.positions.length < check_interval){ lock=null; return; } //No dragging movement, stop here.

	var p2 = this.positions[this.positions.length - 1]; 
	var p1 = this.positions[this.positions.length - check_interval];

	var v = distance( p1["left"], p1["top"], p2["left"], p2["top"] ) 
				/ ( p2["time"] - p1["time"] ); //pixels per ms

	if (p2["time"] - p1["time"] > this.slide_threshold){ lock=null; return; } //Too slow, stop here..	

	//Note: It's weird because "top" isn't really "x" unless you flip the x-axis.
	var dir = direction( p1["left"], p1["top"], p2["left"], p2["top"] );

	this.physics.add_object( this.current_object.attr('id'), dir, v);
}

Movement_manager.prototype.fix_bounds = function(){

	//TODO: remove func altogether;
	return;

	var x = this.current_object.offset().left;
	var y = this.current_object.offset().top;

	if (x < min_x){ x = 0};
	if (x > max_x){ x = max_x; }	
	if (y < 0){ y = 0};
	if (y > max_y){ y = max_y; }

	this.current_object.css({left: x, top: y});
}

Movement_manager.prototype.record_object_position = function(){

	this.positions.push(
		{
			'left': this.current_object.position().left,
			'top': this.current_object.position().top,
			'time' : (new Date()).getTime()
		}
	);
}
