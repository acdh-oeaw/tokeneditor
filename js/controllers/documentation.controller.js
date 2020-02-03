angular.module('tokenEditorApp').controller("Documentation", function ($scope) {
    $scope.exampleTei = '<?xml version="1.0" encoding="UTF-8"?>\
   <TEI xmlns="http://www.tei-c.org/ns/1.0">\
       <teiHeader>\
           <fileDesc>\
               <titleStmt>\
                   <title>ants</title>\
               </titleStmt>\
               <publicationStmt>\
                   <p></p>\
               </publicationStmt>\
               <sourceDesc>\
                   <p></p>\
               </sourceDesc>\
           </fileDesc>\
       </teiHeader>\
       <text>\
           <body>\
               <p>\
                   <w type="DT" lemma="the" status="" morph="" >The</w>\
                   <w type="NN" lemma="dancing" status="" morph="" >dancing</w>\
                   <w type="NNS" lemma="ant" status="" morph="" >ants</w>\
                   <w type="VVP" lemma="love" status="" morph="" >love</w>\
                   <w type="NN" lemma="trance" status="" morph="" >trance</w>\
                   <w type="SENT" lemma="." status="" morph="" >.</w>\
               </p>\
           </body>\
       </text>\
   </TEI>'

    $scope.schemafile = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\
<schema>\
    <namespaces>\
        <namespace>\
            <prefix>tei</prefix>\
            <uri>http://www.tei-c.org/ns/1.0</uri>\
        </namespace>\
    </namespaces>\
    <tokenXPath>//tei:w</tokenXPath>\
    <tokenValueXPath>.</tokenValueXPath>\
    <properties>\
        <property>\
            <propertyName>morph</propertyName>\
            <propertyXPath>@morph</propertyXPath>\
            <propertyType>free text</propertyType>\
        </property>\
        <property>\
            <propertyName>state</propertyName>\
            <propertyXPath>@state</propertyXPath>\
            <propertyType>free text</propertyType>\
        </property>\
        <property>\
            <propertyName>lemma</propertyName>\
            <propertyXPath>@lemma</propertyXPath>\
            <propertyType>free text</propertyType>\
        </property>\
        <property>\
            <propertyName>type</propertyName>\
            <propertyXPath>@type</propertyXPath>\
            <propertyType>closed list</propertyType>\
            <propertyValues>\
                <value>CC</value>\
                <value>CD</value>\
                <value>DT</value>\
                <value>EX</value>\
                <value>FW</value>\
                <value>IN</value>\
                <value>IN/that</value>\
                <value>JJ</value>\
                <value>JJR</value>\
                <value>JJS</value>\
                <value>LS</value>\
                <value>MD</value>\
                <value>NN</value>\
                <value>NNS</value>\
                <value>NP</value>\
                <value>NPS</value>\
                <value>PDT</value>\
                <value>POS</value>\
                <value>PP</value>\
                <value>PP$</value>\
                <value>RB</value>\
                <value>RBR</value>\
                <value>RBS</value>\
                <value>RP</value>\
                <value>SENT</value>\
                <value>SYM</value>\
                <value>TO</value>\
                <value>UH</value>\
                <value>VB</value>\
                <value>VBD</value>\
                <value>VBG</value>\
                <value>VBN</value>\
                <value>VBZ</value>\
                <value>VBP</value>\
                <value>VD</value>\
                <value>VDD</value>\
                <value>VDG</value>\
                <value>VDN</value>\
                <value>VDZ</value>\
                <value>VDP</value>\
                <value>VH</value>\
                <value>VHD</value>\
                <value>VHG</value>\
                <value>VHN</value>\
                <value>VHZ</value>\
                <value>VHP</value>\
                <value>VV</value>\
                <value>VVD</value>\
                <value>VVG</value>\
                <value>VVN</value>\
                <value>VVP</value>\
                <value>VVZ</value>\
                <value>WDT</value>\
                <value>WP</value>\
                <value>WP$</value>\
                <value>WRB</value>\
                <value>:</value>\
                <value>$</value>\
            </propertyValues>\
        </property>\
    </properties>\
</schema>'


    $scope.copytoclipboard = function (text) {

        text.select();
        document.execCommand('copy');
    }

});