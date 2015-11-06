<?php

/*
 * The MIT License
 *
 * Copyright 2015 zozlak.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

namespace import;

/**
 * Description of Property
 *
 * @author zozlak
 */
class Property {
	private $xpath;
	private $type;
	private $name;
	private $values = array();
	
	/**
	 * 
	 * @param \SimpleXMLElement $xml
	 * @throws \LengthException
	 */
	public function __construct(\SimpleXMLElement $xml) {
		if(!isset($xml->propertyXPath) || count($xml->propertyXPath) != 1){
			throw new \LengthException('exactly one propertyXPath has to be provided');
		}
		$this->xpath = (string)$xml->propertyXPath[0];
		
		if(!isset($xml->propertyType) || count($xml->propertyType) != 1){
			throw new \LengthException('exactly one propertyType has to be provided');
		}
		$this->type = (string)$xml->propertyType;

		if(!isset($xml->propertyName) || count($xml->propertyName) != 1){
			throw new \LengthException('exactly one propertyName has to be provided');
		}
		$this->name = (string)$xml->propertyName;
		
		if(isset($xml->propertyValues) && isset($xml->propertyValues->value)){
			$this->values = $xml->propertyValues->value;
		}
	}

	/**
	 * 
	 * @return string
	 */
	public function getXPath(){
		return $this->xpath;
	}

	/**
	 * 
	 * @param \PDO $PDO
	 * @param type $documentId
	 */
	public function save(\PDO $PDO, $documentId){
		$query = $PDO->prepare("INSERT INTO properties (document_id, property_xpath, type_id, name) VALUES (?, ?, ?, ?)");
		$query->execute(array($documentId, $this->xpath, $this->type, $this->name));
		
		$query = $PDO->prepare("INSERT INTO dict_values (document_id, property_xpath, value) VALUES (?, ?, ?)");
		foreach($this->values as $v){
			$query->execute(array($documentId, $this->xpath, $v));
		}
	}
}
