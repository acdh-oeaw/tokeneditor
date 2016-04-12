<?php

/* 
 * Copyright (C) 2016 zozlak
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

use \util\rest\HTTPContoller;

try{
	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Headers: X-Requested-With, Content-Type');

	require_once 'src/util/ClassLoader.php';
	new \util\ClassLoader();
	set_error_handler('\util\rest\HTTPContoller::errorHandler');

	require_once 'config.inc.php';
	\util\DbHandle::setHandle($CONFIG['dbConn']);

	$controller = new HTTPContoller('api');
	$controller->addParam('storageDir', $CONFIG['storageDir']);
	$controller->addParam('userId', filter_input(\INPUT_SERVER, $CONFIG['userid']));
    if(isset($CONFIG['debugUser'])){
        $controller->addParam('userId', $CONFIG['debugUser']);
        $controller->setDebug(true);
    }
	$results = $controller->handleRequest();
	\util\DbHandle::commit();
}catch(\Exception $e){
	HTTPContoller::HTTPCode($e->getMessage());
}