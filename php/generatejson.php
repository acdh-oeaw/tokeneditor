<?php 
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: X-Requested-With, Content-Type');

require_once('config.inc.php');
include 'TokenArray.php';

$con = new PDO($CONFIG['dbConn'], $CONFIG['dbUser'], $CONFIG['dbPasswd']);
$con->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

$userid = filter_input(INPUT_SERVER, $CONFIG['userid']);
$pagesize = filter_input(INPUT_GET, '_pagesize');
$offset =  filter_input(INPUT_GET, '_offset');
$documentid = filter_input(INPUT_GET, '_docid');
$tokenid = filter_input(INPUT_GET, 'token_id');
$tokenF = filter_input(INPUT_GET, 'token');

$ta = new TokenArray($con);
if($tokenid){
	$ta->setTokenIdFilter($tokenid);
}
if($tokenF){
	$ta->setTokenValueFilter($tokenF);
}

$propQuery = $con->prepare('SELECT name FROM properties WHERE document_id = ?');
$propQuery->execute(array($documentid));
while($prop = $propQuery->fetch(PDO::FETCH_COLUMN)){
	$value = (string)filter_input(INPUT_GET, str_replace(' ', '_', $prop));
	if($value !== ''){
		$ta->addFilter($prop, $value);
	}
}

$json = $ta->generateJSON($documentid, $userid, $pagesize, $offset);
header('Content-Type: application/json');
echo $json;
