<?php
require_once('config.php');

try {
	
	$conn = new Mongo($connection_string);
	$db = $conn->$my_default_db;
	$collection = $db->$my_gps_collection;

	# POST
	if (isset($_POST['longitude']) && isset($_POST['latitude'])){

		# Fetch POST data
		$longitude = floatval($_POST['longitude']);
		$latitude = floatval($_POST['latitude']);

		# verify proper range
		if ( $latitude < -90 or $latitude > 90 or $longitude < -180 or $longitude > 180 ){
			throw new Exception('Invalid Latitude or Longitude');
		}

		# Find geo-location data for this user
		$filter = array(
			'id' => hash('sha512', session_id())  # SHA512 so we don't store session_id() in DB
		);

		# Find player
		$player = $collection->findOne($filter);
		
		# If player doesn't exist yet, create it
		if ($player == null){
			$player = array(
				'id' => hash('sha512', session_id()),
			);
		} 

		# geo-location info
		$player['latitude'] = $latitude;
		$player['longitude'] = $longitude;
		$player['timestamp'] = time();

		# save
		$collection->save($player);

		# stop here
		exit;
	}

	# get all records
	$positions = $collection->find();
	
	# set expire: don't show records older than this
	$expire = time() - 5 * 60;
	
	# Return location info for all players
	$players = array();
	foreach( $positions as $position ){
		if (intval($position['timestamp']) > $expire) {
			array_push( $players, array(
							'longitude' => floatval($position['longitude']), 
							'latitude' => floatval($position['latitude']) 
						) 
			);
		}
	}

	# use JSON
	echo json_encode($players);



} catch (Exception $e) {
	die('Error: ' . $e->getMessage());
}

?>
