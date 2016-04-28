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
class Preference extends \util\rest\HTTPEndpoint {
	protected $userId;
	protected $documentId;
	protected $preferenceId;
	
	public function get(\util\rest\FormatterInterface $f) {
		$PDO = \util\DbHandle::getHandle();
		$query = '
			SELECT value
			FROM 
				documents_users_preferences
			WHERE document_id = ? AND user_id = ? AND key = ?';
		$query = $PDO->prepare($query);
		$query->execute(array($this->documentId, $this->userId, $this->preferenceId));
		$result = $query->fetch(\PDO::FETCH_OBJ);
		if($result === false){
			throw new \RuntimeException('There is no such document and key', 400);
		}
		$f->data($result->value);
	}
	
	public function delete(\util\rest\FormatterInterface $f) {
		$PDO = \util\DbHandle::getHandle();
		$query = 'DELETE FROM documents_users_preferences 
				  WHERE document_id = ? AND user_id = ? AND key = ?';
		$query = $PDO->prepare($query);
		$query->execute(array($this->documentId, $this->userId, $this->preferenceId));
		if($query->rowCount() !== 1){
			throw new \RuntimeException('There is no such document and key', 400);
		}
		$f->data(array(
			'document_id' => $this->documentId,
			'preference' => $this->preferenceId
		));	
	}
	
	public function getCollection(\util\rest\FormatterInterface $f) {
		$PDO = \util\DbHandle::getHandle();
		$query = '
			SELECT key, value
			FROM 
				documents_users_preferences
			WHERE document_id = ? AND user_id = ?';
		$query = $PDO->prepare($query);
		$query->execute(array($this->documentId, $this->userId));
		$result = array();
		while($i = $query->fetch(\PDO::FETCH_OBJ)){
			$result[$i->key] = $i->value;
		}
		$f->data($result);
	}
	
	public function put(\util\rest\FormatterInterface $f) {
		$value = $this->filterInput('value');
		$PDO = \util\DbHandle::getHandle();
		$query = '
			UPDATE documents_users_preferences
			SET value = ?
			WHERE document_id = ? AND user_id = ? AND key = ?';
		$query = $PDO->prepare($query);
		$query->execute(array($value, $this->documentId, $this->userId, $this->preferenceId));
		if($query->rowCount() !== 1){
			throw new \RuntimeException('There is no such document and key', 400);
		}
		$f->data(array(
			'document_id' => $this->documentId,
			'preference' => $this->preferenceId,
			'value' => $value
		));
	}
	
	public function postCollection(\util\rest\FormatterInterface $f) {
		$key = $this->filterInput('preference');
		$value = $this->filterInput('value');
		$PDO = \util\DbHandle::getHandle();
		
		$query = '
			SELECT count(*)
			FROM documents_users_preferences 
			WHERE document_id = ? AND user_id = ? AND key = ?';
		$query = $PDO->prepare($query);
		$query->execute(array($this->documentId, $this->userId, $key));
		if($query->fetchColumn() != 0){
			throw new \RuntimeException('Preference already defined', 400);
		}
		
		$query = '
			INSERT INTO documents_users_preferences (document_id, user_id, key, value)
			VALUES (?, ?, ?, ?)';
		$query = $PDO->prepare($query);
		$query->execute(array($this->documentId, $this->userId, $key, $value));

		$f->data(array(
			'document_id' => $this->documentId,
			'preference' => $key,
			'value' => $value
		));
	}
}
