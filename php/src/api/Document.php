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

namespace api;

/**
 * Description of Document
 *
 * @author zozlak
 */
class Document extends \util\rest\HTTPEndpoint {
	protected $userId;
	protected $documentId;
	
	public function get(\util\rest\FormatterInterface $f) {
		$doc = new \model\Document(\util\DbHandle::getHandle());
		$doc->loadDb($this->documentId);

		$fileName = 'tmp/' . time() . rand();
		$doc->export((bool)$this->filterInput('inPlace'), $fileName);
        $f->rawData('');
		header('Content-type: text/xml');
		header('Content-Length: ' . filesize($fileName));
		readfile($fileName);
		unlink($fileName);
	}
	
	public function delete(\util\rest\FormatterInterface $f) {
		$PDO = \util\DbHandle::getHandle();

		$param = array($this->documentId);
		$query = $PDO->prepare("DELETE FROM values WHERE document_id = ?");
		$query->execute($param);
		$query = $PDO->prepare("DELETE FROM orig_values WHERE document_id = ?");
		$query->execute($param);
		$query = $PDO->prepare("DELETE FROM tokens WHERE document_id = ?");
		$query->execute($param);
		$query = $PDO->prepare("DELETE FROM properties WHERE document_id = ?");
		$query->execute($param);
		$query = $PDO->prepare("DELETE FROM dict_values WHERE document_id = ?");
		$query->execute($param);
		$query = $PDO->prepare("DELETE FROM documents_users WHERE document_id = ?");
		$query->execute($param);
		$query = $PDO->prepare("DELETE FROM documents WHERE document_id = ?");
		$query->execute($param);
		
		unlink($GLOBALS['CONFIG']['storageDir'] . '/' . $this->documentId . '.xml'); //TODO do it without referencing global variables
		
		$f->data(array('documentId' => $this->documentId));
	}
	
	public function getCollection(\util\rest\FormatterInterface $f) {
		$PDO = \util\DbHandle::getHandle();
		
		$query = $PDO->prepare('
			SELECT document_id AS "documentId", name, count(*) AS "tokenCount"
			FROM 
				documents 
				JOIN documents_users USING (document_id) 
				JOIN tokens using (document_id)
			WHERE user_id = ?
			GROUP BY 1, 2
			ORDER BY 2
		');
		$query->execute(array($this->userId));
        $f->initCollection();
        while($i = $query->fetch(\PDO::FETCH_OBJ)){
            $i->properties = $this->getProperties($i->documentId);
            $f->append($i);
		}
        $f->closeCollection();
	}
	
	public function postCollection(\util\rest\FormatterInterface $f) {
		$dir = $file = '';
		try{
			if(!isset($_FILES['document']) || !isset($_FILES['schema']) || !is_file($_FILES['document']['tmp_name']) || !is_file($_FILES['schema']['tmp_name'])){
				throw new \RuntimeException('document or schema not uploaded correctly');
			}
			$zip = new \ZipArchive();
			if($zip->open($_FILES['document']['tmp_name']) === true){
				$name = $zip->getNameIndex(0);
				$dir = 'tmp/' . time() . rand();
				mkdir($dir);
				$zip->extractTo($dir, $name);
				$zip->close();
				$file = $dir . '/' . $name;
				$_FILES['document']['tmp_name'] = $file;
			}

            $PDO = \util\DbHandle::getHandle();
			$doc = new \model\Document($PDO);
			$doc->loadFile(
				$_FILES['document']['tmp_name'], 
				$_FILES['schema']['tmp_name'],
				$this->filterInput('name')
			);
			$n = $doc->save($this->storageDir);

			$query = $PDO->prepare("SELECT count(*) FROM users WHERE user_id = ?");
			$query->execute(array($this->userId));
			if($query->fetch(\PDO::FETCH_COLUMN) == 0){
				$query = $PDO->prepare("INSERT INTO users (user_id) VALUES (?)");
				$query->execute(array($this->userId));
			}

			$query = $PDO->prepare("INSERT INTO documents_users (document_id, user_id) VALUES (?, ?)");
			$query->execute(array(
				$doc->getId(), 
				$this->userId
			));
			
			if($n > 0){
				$PDO->commit();
				if(1 === $PDO->query("SELECT count(*) FROM documents")->fetch(\PDO::FETCH_COLUMN)){
					$PDO->query("VACUUM ANALYZE");
				}
                $f->data(array(
					'documentId'  => $doc->getId(),
					'name'        => filter_input(INPUT_POST, 'name'),
                    'properties'  => $this->getProperties($doc->getId()),
					'tokensCount' => $n
                ));
			}else{
				$PDO->rollBack();
                throw new \RuntimeException('no tokens found - maybe your schema is wrong', 400);
			}
		} finally {
			if($file !== ''){
				unlink($file);
			}
			if($dir !== ''){
				rmdir($dir);
			}
		}
	}
    
    private function getProperties($documentId){
		$PDO = \util\DbHandle::getHandle();
		
		$propQuery = $PDO->prepare('
			SELECT 
				property_xpath AS "propertyXPath", 
				name, 
				type_id AS "typeId",
				ord,
				read_only AS "readOnly",
				json_agg(value ORDER BY value) AS values
			FROM 
				properties
				LEFT JOIN dict_values USING (document_id, property_xpath)
			WHERE document_id = ?
			GROUP BY document_id, 1, 2, 3, 4
			ORDER BY ord	
		');
        
    	$propQuery->execute(array($documentId));
		$properties = array();
		while($prop = $propQuery->fetch(\PDO::FETCH_OBJ)){
			$prop->values = json_decode($prop->values);
			$properties[$prop->name] = $prop;
		}
        return $properties;
    }
}
