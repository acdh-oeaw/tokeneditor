<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace util\rest;

/**
 * Description of Endpoint
 *
 * @author zozlak
 */
class HTTPEndpoint {
	private $args;
	
	public function __construct(\stdClass $path) {
		foreach($path as $key => $value){
			$this->$key = $value;
		}
	}
	
	public function get(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function head(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function post(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function put(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function delete(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function trace(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function options(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function connect(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function patch(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function getCollection(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function postCollection(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function putCollection(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function deleteCollection(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function traceCollection(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function optionsCollection(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function connectCollection(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	public function patchCollection(FormatterInterface $f){
		throw new \BadMethodCallException('Method not implemented');
	}
	
	public function filterInput($name){
		$method = filter_input(\INPUT_SERVER, 'REQUEST_METHOD');
		if($method === 'GET'){
			return filter_input(\INPUT_GET, $name);
		}else if($method === 'POST'){
			return filter_input(\INPUT_POST, $name);
		}else{
			if($this->args === null){
				parse_str(file_get_contents("php://input"), $this->args);
			}
			if(!array_key_exists($name, $this->args)){
				return null;
			}
			return $this->args[$name];
		}
	}
	
	public function toUnderscore($name){
		$parts = preg_split('/[A-Z]/', $name);
		$n = mb_strlen($parts[0]);
		$res = $parts[0];
		foreach($parts as $k => $i){
			if($k !== 0){
				$res .= '_' . strtolower(mb_substr($name, $n, 1)). $i;
				$n += mb_strlen($i) + 1;
			}
		}
		return $res;
	}
}
