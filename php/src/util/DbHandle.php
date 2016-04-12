<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace util;

/**
 * Description of DbHandle
 *
 * @author zozlak
 */
class DbHandle {
	/**
	 *
	 * @var \PDO
	 */
	static private $PDO;
	
	static public function setHandle($connParam){
		self::$PDO = new \PDO($connParam);
		self::$PDO->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
		self::$PDO->beginTransaction();
	}
	
	/**
	 * 
	 * @return \PDO
	 */
	static public function getHandle(){
		return self::$PDO;
	}
	
	static public function commit(){
        if(self::$PDO->inTransaction()){
            self::$PDO->commit();
        }
	}
}
