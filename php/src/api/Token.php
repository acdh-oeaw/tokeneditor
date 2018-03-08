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
 * Description of Token
 *
 * @author zozlak
 */
class Token extends \util\rest\HTTPEndpoint {

    public function put(\util\rest\FormatterInterface $f) {
        $PDO = \util\DbHandle::getHandle();

        $propName = $this->filterInput('property_name');
        $value = $this->filterInput('value');
        $property = $this->propName2propXPath($this->filterInput('name'));

        $lookup = $PDO->prepare("SELECT count(*) FROM values where document_id = ? AND property_xpath = ? AND token_id = ? AND user_id = ?");
        $lookup->execute(array($this->documentId, $property, $this->tokenId, $this->userId));
        $resultlkup = $lookup->fetch(\PDO::FETCH_COLUMN);

        if ($resultlkup > 0) {
            $updquery = $PDO->prepare("UPDATE values SET value = ? WHERE document_id = ? AND property_xpath = ? AND token_id = ? AND user_id = ?");
            $updquery->execute(array($value, $this->documentId, $property, $this->tokenId, $this->userId));
        } else {
            $query = $PDO->prepare("INSERT INTO values (document_id,property_xpath,token_id,user_id,value) VALUES (?, ?, ?, ?, ?)");
            $query->execute(array($this->documentId, $property, $this->tokenId, $this->userId, $value));
        }

        $f->data(array(
            'documentId' => $this->documentId,
            'tokenId' => $this->tokenId,
            'propertyName' => $propName,
            'value' => $value
        ));
    }

    public function getCollection(\util\rest\FormatterInterface $f) {
        $PDO = \util\DbHandle::getHandle();
        
        $pageSize    = $this->filterInput('_pageSize');
        $offset      = $this->filterInput('_offset');
        $tokenId     = $this->filterInput('tokenId');
        $tokenFilter = $this->filterInput('token');
        $propxpath =    $this->propName2propXPath($this->filterInput('propertyName'));

        $tokenArray = new util\TokenArray($PDO, $this->documentId, $this->userId);
        if ($tokenId) {
            $tokenArray->setTokenIdFilter($tokenId);
        }
        if ($tokenFilter) {
            $tokenArray->setTokenValueFilter($tokenFilter);
        }
        
        $propQuery = $PDO->prepare('SELECT name FROM properties WHERE document_id = ?');
        $propQuery->execute(array($this->documentId));
        while ($prop = $propQuery->fetch(\PDO::FETCH_COLUMN)) {
            $value = (string) $this->filterInput(str_replace(' ', '_', $prop));
            if ($value !== '') {
                $tokenArray->addFilter($prop, $value);
            }
        }

        header('Content-Type: application/json');
        if($this->filterInput('tokensOnly')){
            $res = $tokenArray->getTokensOnly($pageSize ? $pageSize : 1000, $offset ? $offset : 0);
        } else if($this->filterInput('stats')){
            $res = $tokenArray->getStats($propxpath ? $propxpath : '@state');
        }
        
        else{
            $res = $tokenArray->getData($pageSize ? $pageSize : 1000, $offset ? $offset : 0);
        }
        $f->rawData($res);
    }

    private function propName2propXPath($propName){
        $PDO = \util\DbHandle::getHandle();
        $query = $PDO->prepare("SELECT property_xpath FROM properties WHERE document_id = ? AND name = ?");
        $query->execute(array($this->documentId, $propName));
        return $query->fetch(\PDO::FETCH_COLUMN);
    }
}
