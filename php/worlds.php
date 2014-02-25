<?php
require_once('config.php');

try {
	
	$conn = new Mongo($connection_string);
	$db = $conn->$my_default_db;
	$collection = $db->$my_worlds_collection;


	# our return var
	$data = array();
	
	# This is an image move
	if (
		isset($_POST['world']) && 
		isset($_POST['image_id']) &&
		isset($_POST['top']) &&
		isset($_POST['left'])
	) {
		
		$world = $_POST['world'];
		$image_id = $_POST['image_id'];
		$top = floatval($_POST['top']);
		$left = floatval($_POST['left']);

		$top = max(0, $top);
		$top = min(1, $top);

		$left = max(0, $left);
		$left = min(1, $left);

		# Uniquely identify an image
		$filter = array(
			'world' => $world,
			'image_id' => $image_id
		);

		# fetch image, if exists
		$obj = $collection->findOne($filter);
		if ($obj == null){
			$obj = $filter;
		}

		# set position
		$obj['top'] = $top;
		$obj['left'] = $left;

		# save
		$collection->save($obj);

	# This is fetching world image positions
	} else if (isset($_GET['world'])){

		$world = $_GET['world'];

		# Filter by world		
		$filter = array(
			'world' => $world 
		);

		# Fetch all image position data
		$positions = $collection->find($filter);

		# populate data
		foreach($positions as $position){
			array_push($data, $position);	
		}


	# Show all worlds
	} else {
	
		# Fetch all world names
		$worlds = $collection->distinct('world');

		# populate data
		foreach( $worlds as $world ){
			array_push($data, $world);
		}
	} 

	# use JSON
	echo json_encode($data);

} catch (Exception $e) {
	die('Error: ' . $e->getMessage());
}

?>
