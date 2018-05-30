<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require 'treetagger-php/autoload.php';
$tt = new TreeTagger\TreeTagger();
$tt->setPath("/usr/opt/treetagger");
$array = array(array('the','new','house'));
$result = $tt->batchTag($array);
print_r ($result);
?>