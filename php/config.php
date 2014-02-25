<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_save_path('/PATH/TO/php_sessions');
session_start();


$my_id="USERNAME";    
$my_password="PASSWORD";     
$my_default_db="DB_NAME";
$my_gps_collection = $my_id . '_gps';
$my_worlds_collection = $my_id . '_worlds';

$connection_string = "mongodb://$my_id:$my_password@localhost/$my_default_db";


?>
