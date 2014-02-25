var my_position;

function writeNav(){
	var pages = ['home.html', 'lobby.html', 'sonar.html'];
	var page = document.URL;
	var nav = '<div class="navbar navbar-inverse">' +
				'<div class="navbar-inner">' +
					'<div class="container-fluid">' + 
						'<a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">' +
							'<span class="icon-bar"></span>' +							
							'<span class="icon-bar"></span>' +  
							'<span class="icon-bar"></span>' +
						'</a>' +
					'<a class="brand" href="home.html">Tic-Tac-Toe</a>' + 
					'<div class="nav-collapse">' +
						'<ul class="nav">'; 
	for( var ind = 0; ind < pages.length; ind++){
		nav += '<li';
		if (page.indexOf(pages[ind]) !== -1){
			nav += ' class="active" ';
		}
		nav += '><a href="' + pages[ind] + '">' + pages[ind][0].toUpperCase() + pages[ind].substring(1, pages[ind].length - 5) + '</a>';
	}
	nav += '</ul>' + '</div>' + '</div>' + '</div>' + '</div>';
	document.write(nav);
}


//GPS Push:
function push_geolocation(){
	navigator.geolocation.getCurrentPosition(
		function(position){ //Success
			//console.log(position.coords.latitude + " / " + position.coords.longitude);
			my_position = position;
			console.log(position);
			var request = $.ajax({
				url: 'php/gps.php',
				type: 'POST',
				data: {'latitude': position.coords.latitude, 'longitude': position.coords.longitude },
			});

			request.fail(function(jqXHR, error){
				console.log('GPS POST FAILED: ' + error);
			});
		}, 
		function(error){ //Fail
			console.log(error);
		}
	);
}

if(navigator.geolocation){
	push_geolocation();
	setInterval(function(){ push_geolocation() }, 5000);
}
