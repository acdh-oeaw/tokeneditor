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

namespace api\util;

class TokenArray {
    /**
     *
     * @var type \PDO
     */
	private $PDO;
    private $documentId;
    private $userId;
	private $tokenIdFilter;
	private $tokenValueFilter;
	private $filters = array();
	
	public function __construct(\PDO $PDO, $documentId, $userId) {
		$this->PDO = $PDO;
        $this->documentId = $documentId;
        $this->userId = $userId;
	}
	
	public function setTokenIdFilter($id){
		$this->tokenIdFilter = $id;
	}
	
	public function setTokenValueFilter($val){
		$this->tokenValueFilter = $val;
	}
	
	/**
	 * 
	 * @param type $prop property xpath
	 * @param type $val filter value
	 */
	public function addFilter($prop, $val){
		$this->filters[$prop] = $val;
	}
	
	public function getData($pageSize = 1000, $offset = 0) {
		list($filterQuery, $filterParam) = $this->getFilters();
		$queryStr = "
			WITH filter AS (" . $filterQuery . ")
			SELECT
				json_build_object(
					'tokenCount', (SELECT count(*) FROM filter), 
					'data', COALESCE( 
						json_agg(json_object(array_cat(array['tokenId', 'token'], names), array_cat(array[token_id::text, value], values))), 
						array_to_json(array[]::text[]) 
					) 
				) 
			FROM ( 
				SELECT 
					token_id, t.value, 
					array_agg(COALESCE(uv.value, cv.value, v.value) ORDER BY ord) AS values, 
					array_agg(p.name ORDER BY ord) AS names 
				FROM
					(
						SELECT *
						FROM filter
						LIMIT ? 
						OFFSET ?
					) f
					JOIN tokens t USING (document_id, token_id) 
					JOIN properties p USING (document_id)
					JOIN orig_values v USING (document_id, property_xpath, token_id) 
					LEFT JOIN (
						SELECT *
						FROM values 
						WHERE user_id = ?
					) uv USING (document_id, property_xpath, token_id) 
					LEFT JOIN (
						SELECT *
						FROM (
							SELECT 
								document_id, property_xpath, token_id, value, 
								row_number() OVER (PARTITION BY document_id, property_xpath, token_id ORDER BY date DESC) AS n
							FROM 
								values
								JOIN (
									SELECT *
									FROM filter
									LIMIT ? 
									OFFSET ?
								) ff USING (document_id, token_id)
						) t
						WHERE n = 1
					) cv USING (document_id, property_xpath, token_id)
				GROUP BY 1, 2 
				ORDER BY token_id 
			) t";
		$query = $this->PDO->prepare($queryStr);
		$param = array_merge($filterParam, array($pageSize, $offset, $this->userId, $pageSize, $offset));
		$query->execute($param);
		$result = $query->fetch(\PDO::FETCH_COLUMN);
		
		return $result;
	}

	public function getTokensOnly($pageSize = 1000, $offset = 0){
		list($filterQuery, $filterParam) = $this->getFilters();
		$queryStr = "
			WITH filter AS (" . $filterQuery . ")
			SELECT 
				json_build_object(
					'tokenCount', (SELECT count(*) FROM filter),
					'data', COALESCE(
						json_agg(json_build_object('tokenId', token_id, 'token', value) ORDER BY token_id),
						'[]'
					)
				)
			FROM 
				documents_users
				JOIN tokens USING (document_id)
				JOIN (
					SELECT * 
					FROM filter 
					LIMIT ?
					OFFSET ?
				) t USING (document_id, token_id)
			WHERE user_id = ?";
		$query = $this->PDO->prepare($queryStr);
		$params = array_merge($filterParam, array($pageSize, $offset, $this->userId));
		$query->execute($params);
		$result = $query->fetch(\PDO::FETCH_COLUMN);
		
		return $result ? $result : '[]';
	}
	
	private function getFilters(){
		$query = $this->PDO->prepare("SELECT property_xpath, name FROM properties WHERE document_id = ?");
		$query->execute(array($this->documentId));
		$propDict = array();
		while($prop = $query->fetch(\PDO::FETCH_OBJ)){
			$propDict[$prop->name] = $prop->property_xpath;
		}
		
		$query = "";
		$n = 1;
		$params = array();
		
		if($this->tokenIdFilter !== null){
			$query .= "
				JOIN (
					SELECT ?::int AS token_id
				) f" . $n++ . " USING (token_id)";
			$params[] = $this->tokenIdFilter;
		}
		if($this->tokenValueFilter !== null){
			$query .= "
				JOIN (
					SELECT token_id
					FROM tokens
					WHERE 
						document_id = ?
						AND lower(value) LIKE lower(?)
				) f" . $n++ . " USING (token_id)";
			$params[] = $this->documentId;
			$params[] = $this->tokenValueFilter;
		}
		
		foreach($this->filters as $prop=>$val){
			if(!isset($propDict[$prop])){
				continue;
			}
			$query .= "
				JOIN (
					SELECT token_id
					FROM 
						orig_values o
						LEFT JOIN values v USING (document_id, property_xpath, token_id)
					WHERE
						document_id = ?
						AND property_xpath = ?
						AND (user_id = ? OR user_id IS NULL)
						AND COALESCE(v.value, o.value) ILIKE ?
				) f" . $n++ . " USING (token_id)";
			$params[] = $this->documentId;
			$params[] = $propDict[$prop];
			$params[] = $this->userId;
			$params[] = $val;
		}
		
		$query = "				
			SELECT DISTINCT document_id, token_id
			FROM
				documents_users
				JOIN tokens USING (document_id)
				" . $query . " 
			WHERE document_id = ? AND user_id = ?
			ORDER BY token_id";
		$params[] = $this->documentId;
		$params[] = $this->userId;
		
		return array($query, $params);
	}
	
}