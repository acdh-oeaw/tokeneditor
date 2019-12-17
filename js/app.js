/* global input */

var queryNo = 0;

var app = angular.module(
    'myApp',
    ['ngResource', 'ngSanitize','ngAnimate','ui.bootstrap','ui.grid', 'ui.grid.pagination', 'ui.grid.resizeColumns', 'ui.grid.edit', 'ui.grid.cellNav', 'ui.grid.exporter', 'ui.grid.selection', 'ui.router', 'ngFileUpload', 'prettyXml']);



app.factory('DocumentsFactory', ['$resource', function ($resource) {
    var factory = {
        Documents: [],
        currentDocument: {},
        retrieveDocuments: function () {
            var getData = $resource(apiBase + '/document', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                }
            });
            getData.query().$promise.then(function (res) {
                factory.Documents = _.filter(res, function (o) {
                    if (_.has(o, 'documentId')) {
                        return o;
                    }
                });
            });
        },
        getDocuments: function () {
            return this.Documents;
        },
        setCurrentDocument(doc) {
            factory.currentDocument = doc;
        }
    }
    return factory;
}]);

app.factory('StatsFactory', ['$resource', '$q', function ($resource, $q) {
    var factory = {
        Stats: {},
        statsLoading:false,
        unsetStats: function () {
            Object.keys(factory.Stats).forEach(function (key) {
                delete factory.Stats[key]
            });
        },
        setLoadingState(bool) {
            factory.statsLoading = bool;
        },
        retrieveTokenCountForPropertyValues: function (docid, selproperty, documentokencount) {
            factory.setLoadingState(true);
            var getAllData = function () {
                var promises = [];
                selproperty.propertyValues.forEach(function (pv) {
                    var params = {};
                    params[selproperty.name] = pv.value;
                    params['_offset'] = 0;
                    params['_pageSize'] = 1;
                    promises.push($resource(apiBase + '/document/' + docid + '/token', {}, {
                        query: {
                            method: 'GET',
                            isArray: false,
                            params: params
                        }
                    }).query().$promise);
                });
                return $q.all(promises);
            }
            getAllData().then(values => {
                factory.setLoadingState(false);
                values.forEach(function (val) {
                    var valObj = _.values(val);

                    if (valObj[1].length > 0) {
                        var propvalname = valObj[1][0][selproperty.name];
                        
                        var propvalcount = valObj[0];
                        factory.Stats[propvalname] = {
                            'count': propvalcount,
                            'percentage': ((propvalcount / documentokencount) * 100).toFixed(2)
                        };
                        
                        /*factory.Stats['undetermined'] = {
                            'count': documentokencount - propvalcount,
                            'percentage': ((propvalcount / documentokencount) * 100).toFixed(2)
                        };*/

                    };
                })
                
            });
        }
    }
    return factory;
}]);


app.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {


    $urlRouterProvider.otherwise('/');
    var homeState = {
        name: 'home',
        url: '/',
        templateUrl: 'templates/home.html'
    }

    var documentationState = {
        name: 'documentation',
        url: '/documentation',
        templateUrl: 'templates/documentation.html'
    }

    var editorState = {
        name: 'editor',
        url: '/editor/:documentId',
        templateUrl: 'templates/editor.html'
    }

   /* var imprintState = {
        name: 'imprint',
        url: '/imprint',
        templateUrl: 'templates/imprint.html'
    } */

    $locationProvider.html5Mode(true);
    $stateProvider.state(homeState);
    $stateProvider.state(editorState);
    $stateProvider.state(documentationState);
  //  $stateProvider.state(imprintState);
});



var paginationOptions = {
    pageNumber: 1,
    pageSize: 25,
    sort: null
};




var authPopupCount = 0;

function handleError(resp, status) {
    if (status === 401 && authPopupCount === 0) {
        authPopupCount = 1;
        $("#authModal").show();
        $(document).on("click", ".closeauthmodal", function () {
            $("#authModal").hide();
            authPopupCount = 0;
        });
    }
}

var filterQueryNo = 0;
app.controller('MainCtrl', ['$scope', '$http', '$timeout', '$state', 'DocumentsFactory', 'Upload', '$location', function ($scope, $http, $timeout, $state, DocumentsFactory, Upload, $locationProvider, $location) {


    $scope.apiBase = apiBase;

    $scope.$watch(function () {
        return DocumentsFactory.Documents;
    }, function (newValue, oldValue) {
        $scope.documents = DocumentsFactory.Documents;
    });

    $scope.$watch(function () {
        return DocumentsFactory.currentDocument;
    }, function (newValue, oldValue) {
        $scope.currentDocument = DocumentsFactory.currentDocument;
    });

    $scope.$watch(function () {
        return $state.$current.name;
    }, function (newVal, oldVal) {
        $scope.currentView = $state.current.name;
    })



    $scope.documents = DocumentsFactory.getDocuments();


    $scope.selectedStatsProperty = {};
    //   $scope.documents = DocumentsService.documents;


    $scope.userLogin = new TokenEditorLogin(loginConfig);

    $timeout(function () {
        $scope.userLogin.onLogin(function () {
            DocumentsFactory.retrieveDocuments();

        });
    });

    $scope.userLogin.onLogout(function () {
        location = location.origin + '/tokenEditor/';
    });

    $scope.userLogin.initialize();


    /* Import */
    $scope.importDocumentName;
    $scope.importDocumentFile;
    $scope.importDocumentSchema;

    $scope.importDocument = function (datafile, schemafile, docname) {
        Upload.upload({
            url: apiBase + '/document',
            data: {
                'document': datafile,
                'schema': schemafile,
                'name': docname
            }
        }).then(function (resp) {
            $scope.uploadSuccess = true;
            $scope.importMessage = "Your import was successful!";
            DocumentsFactory.retrieveDocuments();
        }, function (resp) {
            $scope.uploadSuccess = false;
            handleError;
            if (resp.statusText) {
                $scope.importMessage = "Import failed:" + resp.statusText;
            } else {
                $scope.importMessage = "Import failed"
            }
        });
    }
    var docid;



}]);

/* Controller for the editing interface which contains the grid and the tokeneditor widgets */
app.controller('EditorCtrl', ['$scope', '$http', '$timeout', '$state', 'DocumentsFactory', 'StatsFactory', '$location', function ($scope, $http, $timeout, $state, DocumentsFactory, StatsFactory, $locationProvider, $location) {

    var docid;

    
   $scope.StatsFactory = StatsFactory;
    $scope.documents = DocumentsFactory.getDocuments();

    if ($scope.documents === undefined) {
        DocumentsFactory.retrieveDocuments();
        $scope.documents = DocumentsFactory.getDocuments();
    }

    $scope.currentDocumentId = parseInt($state.params.documentId);
    $scope.currentDocument = _.find($scope.documents, function (doc) {
        return doc.documentId === $scope.currentDocumentId;
    });

    DocumentsFactory.setCurrentDocument($scope.currentDocument);

    $scope.currentDocumentProperties = _.values($scope.currentDocument.properties);


    /* For the Stats Widget only Boolean, Closed List, Combo Box are smart to use, since main goal is tracking of the progress */
    $scope.filteredProperties = _.filter($scope.currentDocumentProperties, {
        'typeId': 'closed list'
    });

    $scope.unsetStats = StatsFactory.unsetStats;
    $scope.generateStats = StatsFactory.retrieveTokenCountForPropertyValues;


    $scope.statsForCurrentDoc = StatsFactory.Stats;

    $scope.sortStats = function (sortprop, sortdirection) {
        $scope.statsForCurrentDoc = _.sortBy($scope.statsForCurrentDoc, sortprop);
    }


    $scope.gridOptions = {};
    $scope.gridOptions = {
        paginationPageSizes: [25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000],
        paginationPageSize: 25,
        enableFiltering: true,
        enableGridMenu: true,
        enableCellEditOnFocus: true,
        useExternalPagination: true,
        useExternalSorting: true,
        gridMenuCustomItems: [{
            title: 'export filtered document as CSV',
            action: function ($event) {
                var filters = '';
                _.each($scope.gridApi.grid.columns, function (col) {
                    if (col.filters[0].term) {
                        filters += '&' + col.field + '=' + col.filters[0].term;
                    }
                });
                window.location.href = apiBase + '/document/' + $scope.currentDocumentId + '/token?_format=text/csv' + filters;
            },
            order: 0
        }],
        enableRowSelection: true,
        useExternalFiltering: true,
        modifierKeysToMultiSelectCells: true,
        exporterMenuCsv: false,
        exporterMenuPdf: false,
        rowTemplate: '<div ng-class="{ \'green\': grid.appScope.rowFormatter( row ),\'grey\':row.entity.state===\'u\',\'grey\':row.entity.state===\'Questionable\',\'grey\':row.entity.Status===\'Questionable\',\'green\':row.entity.state===\'OK\',\'green\':row.entity.Status===\'OK\' }">' + '  <div ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader,\'custom\': true  }"  ui-grid-cell></div>' + '</div>',
        columnDefs: [],

        onRegisterApi: function (gridApi) {
            $scope.gridApi = gridApi;
            $scope.showEmptyCells = function (colFilter) {
                colFilter.term = null;
            }
            $scope.resetColumnFilter = function (colFilter) {
                colFilter.term = '';
            }


            $scope.gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue !== oldValue) {
                    var data = new Object();
                    data.name = colDef.name;
                    data.value = newValue;

                    $scope.$apply();
                    $scope.refreshstats();
                    $http({
                        method: 'PUT',
                        url: apiBase + '/document/' + $scope.currentDocumentId + '/token/' + encodeURIComponent(rowEntity['tokenId']),
                        data: $.param(data),
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }).success(function () {
                        $scope.trackProgress($scope.currentDocumentId);
                    }).error(handleError);

                }

            });

            $scope.focusedToken;
            $scope.focusedTokenId;
            $scope.focusedTokenContextLeft = '';
            $scope.focusedTokenContextRight = '';
            $scope.context = {};
            $scope.context.left = '';
            $scope.context.right = '';

            $scope.gridApi.cellNav.on.navigate($scope, function (newRowCol, oldRowCol) {

                $scope.focusedToken = newRowCol.row.entity;

                $scope.focusedTokenId = parseInt($scope.focusedToken.tokenId);
                var contextLengthRight = 40;
                var contextLengthLeft = 0;
                var maxRight = 0;

                if ($scope.focusedTokenId < 40) {

                    contextLengthLeft = $scope.focusedTokenId - 1;
                } else {
                    contextLengthLeft = 40;
                }
                var minLeft = Math.max(0, $scope.focusedTokenId - contextLengthLeft - 1);
                var tokenIdnextToken = $scope.focusedTokenId + 1;

                $scope.getContext(minLeft, contextLengthLeft, 'left');
                $scope.getContext($scope.focusedTokenId, contextLengthRight, 'right');

            });
            $scope.gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {

                $scope.batchEditToken = _.clone(rows[0].entity);
            });

            $scope.gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                var rows = $scope.gridApi.selection.getSelectedRows();
                $scope.batchEditToken = _.clone(rows[0]);
            });

            $scope.gridApi.core.on.sortChanged($scope, function (grid, sortColumns) {});

            gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                $scope.getData(function (data) {
                    $scope.flattened = [];
                    $scope.gridOptions.data = data.data;
                    $scope.gridOptions.totalItems = data.tokenCount;
                });
            });

            $scope.gridApi.core.on.filterChanged($scope, function () {
                $scope.getData(function (data) {
                    $scope.flattened = [];
                    $scope.gridOptions.data = data.data;
                    $scope.gridOptions.totalItems = data.tokenCount;
                });
            });
        }
    };

    $scope.getDataTimeout = null;
    $scope.getContext = function (offset, pageSize, direction) {

        var params = {
            _offset: offset,
            _pageSize: pageSize
        };

        $http({
            method: 'GET',
            url: apiBase + '/document/' + $scope.currentDocumentId + '/token',
            params: params,
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function (data) {
            if (pageSize === 0 && direction === 'left') {
                $scope.context[direction] = '';
            } else {
                $scope.context[direction] = _.map(data.data, 'token').join(" ");
            }
        }).error(handleError);

    }

    $scope.assignToAll = function (token) {
        var grid = $scope.gridApi.grid;
        var rows = $scope.gridApi.selection.getSelectedRows();
        _.each(rows, function (currentToken) {
            _.map(currentToken, function (property, propertyname) {

                if (!(propertyname === "tokenId" || propertyname === "token" || propertyname === "$$hashKey") && currentToken[propertyname] !== token[propertyname] && token[propertyname] !== '') {

                    currentToken[propertyname] = token[propertyname];
                    var updatedData = new Object();
                    updatedData.name = propertyname;
                    updatedData.value = token[propertyname];

                    $http({
                        method: 'PUT',
                        url: apiBase + '/document/' + $scope.currentDocumentId + '/token/' + encodeURIComponent(currentToken['tokenId']),
                        data: $.param(updatedData),
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }).error(handleError);

                }
            })

        });
        $scope.trackProgress($scope.currentDocumentId);
    }
    $scope.getData = function (callback) {
        if ($scope.getDataTimeout) {
            clearTimeout($scope.getDataTimeout);
        }
        $scope.getDataTimeout = setTimeout(
            function () {
                var grid = $scope.gridApi.grid;
                var params = {
                    _pageSize: $scope.gridOptions.paginationPageSize,
                    _offset: ($scope.gridOptions.paginationCurrentPage - 1) * $scope.gridOptions.paginationPageSize
                };
                grid.columns.forEach(function (value, key) {
                    if (value.filters[0].term) {
                        params[value.name] = value.filters[0].term;
                    } else if (value.filters[0].term === null) {
                        params[value.name] = "";
                    }
                });
                queryNo++;
                var storedQueryNo = queryNo;

                $http({
                    method: 'GET',
                    url: apiBase + '/document/' + $scope.currentDocumentId + '/token',
                    params: params,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).success(function (data) {
                    if (queryNo === storedQueryNo) {
                        callback(data);
                    }
                }).error(handleError);
            },
            500);
    };

    $scope.getToken = function (docId) {
        $scope.gridOptions.columnDefs = [];
        $scope.creategrid = true;
        $scope.refreshstats();
        $scope.tokenCount = 0;
        $scope.apiBase = apiBase;

        $http({
            method: 'GET',
            url: apiBase + '/document/' + docId + '/token',
            params: {
                _pageSize: $scope.gridOptions.paginationPageSize,
                _offset: ($scope.gridOptions.paginationCurrentPage - 1) * $scope.gridOptions.paginationPageSize || 0
            },
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function (data) {
            $scope.flattened = [];
            $scope.gridOptions.columnDefs = [];

            $scope.gridOptions.data = data.data;
            $scope.gridOptions.totalItems = data.tokenCount;
            $scope.tokenCount = data.tokenCount;

            $scope.gridOptions.columnDefs.push(widgetFactory({
                name: 'tokenId',
                typeId: ''
            }).registerInGrid($scope));
            $scope.properties = $scope.currentDocument.properties;
            $scope.batchEditProperties = {};
            _.forEach($scope.properties, function (value, key) {
                if (value.readOnly === false) {
                    $scope.batchEditProperties[key] = value;
                }
            });

            _.forEach($scope.properties, function (value, key) {
                var widget = widgetFactory(value);
                $scope.gridOptions.columnDefs.push(widget.registerInGrid($scope));
            });
            $scope.states = $scope.properties;
            $scope.trackProgress(docId);
        }).error(handleError);

        $scope.filterOptions = {
            filterText: "",
            useExternalFilter: true
        };

        $scope.update = function (column, row, cellValue) {};
        $scope.showPropertyValues = function (selected) {
            $scope.propertyValues = selected.values;
        }

        $scope.arrayOfChangedObjects = [];

        $scope.rowFormatter = function (row) {
            return row.entity.state === 's';
        };
        $scope.labels = [];
        $scope.items = [];
        $scope.data = [];
        $scope.counters = [];
        $timeout(callAtTimeout, 2000);

        function callAtTimeout() {
            $scope.getUserPrefs($scope.currentDocumentId);
        }

    };

    $scope.getUserPrefs = function (docid) {
        $scope.documentPrefs = {};
        $http({
            method: 'GET',
            url: apiBase + '/document/' + $scope.currentDocumentId + '/preference',
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function (data) {
            if (typeof data === 'object') {
                $scope.documentPrefs = data;
            }
        }).error(handleError);
    }

    $scope.trackProgress = function (docid) {
        $http({
            method: 'GET',
            url: apiBase + '/document/' + encodeURIComponent(docid) + '/token?stats=true',
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function (data) {
            var unchecked = {};
            $scope.stats = data;
            _.each($scope.stats, function (o) {
                _.assign(o, {
                    'percentage': (o.count / $scope.tokenCount * 100).toFixed(2)
                });
            });
            var diff = 0;
            var count = _.map(data, 'count');
            _.each(count, function (o) {
                diff = diff + o;
            });

            unchecked.value = 'unchecked';

            unchecked.count = $scope.tokenCount - diff;
            unchecked.percentage = ((($scope.tokenCount - diff) / $scope.tokenCount) * 100).toFixed(2);
            $scope.stats.unchecked = unchecked;
        }).error(handleError);
    }

    $scope.refreshstats = function () {
        $scope.labels = [];
        $scope.data = [];
        $scope.colors = [];
        countData = _.countBy($scope.gridOptions.data, function (item) {
            return item.type;
        });
        angular.forEach(countData, function (key, item) {

            $scope.labels.push(item);
            $scope.data.push(key);
        });
    };
}]);

app.controller("Documentation", function ($scope) {
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


app.run(['$transitions', function ($transitions) {
    $transitions.onSuccess({}, function () {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    })
}]);