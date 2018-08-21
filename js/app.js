/* global input */

var queryNo = 0;

var app = angular.module(
        'myApp',
        ['ngSanitize', 'ui.grid', 'ui.grid.pagination', 'ui.grid.resizeColumns', 'ui.grid.edit', 'ui.grid.cellNav', 'ui.grid.exporter', 'chart.js', 'ui.grid.selection', 'ui.bootstrap']);

var paginationOptions = {
    pageNumber: 1,
    pageSize: 25,
    sort: null
};

var filterQueryNo = 0;
app.controller('MainCtrl', ['$scope', '$http', '$timeout', '$location', function ($scope, $http, $timeout, $locationProvider, $location) {
        var docid;



        $scope.gridOptions = {};
        $scope.gridOptions = {
            paginationPageSizes: [25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000],
            paginationPageSize: 25,
            enableFiltering: true,
            enableGridMenu: true,
            enableCellEditOnFocus: true,
            useExternalPagination: true,
            useExternalSorting: true,
            enableRowSelection: true,
            useExternalFiltering: true,
            modifierKeysToMultiSelectCells: true,
            rowTemplate: '<div ng-class="{ \'green\': grid.appScope.rowFormatter( row ),\'grey\':row.entity.state===\'u\',\'grey\':row.entity.state===\'Questionable\',\'grey\':row.entity.Status===\'Questionable\',\'green\':row.entity.state===\'OK\',\'green\':row.entity.Status===\'OK\' }">' + '  <div ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader,\'custom\': true  }"  ui-grid-cell></div>' + '</div>',
            columnDefs: [],

            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;

                $scope.gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                    if (newValue !== oldValue) {
                        var data = new Object();
                        data.name = colDef.name;
                        data.value = newValue;

                        $scope.$apply();
                        $scope.refreshstats();
                        $http({
                            method: 'PUT',
                            url: apiBase + '/document/' + encodeURIComponent($('#docid').val()) + '/token/' + encodeURIComponent(rowEntity['tokenId']),
                            data: $.param(data),
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        }).success(function () {
                            $scope.trackProgress($('#docid').val());
                        });

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
                url: apiBase + '/document/' + encodeURIComponent($('#docid').val()) + '/token',
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
            });

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
                            url: apiBase + '/document/' + encodeURIComponent($('#docid').val()) + '/token/' + encodeURIComponent(currentToken['tokenId']),
                            data: $.param(updatedData),
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        });

                    }
                })

            });
            $scope.trackProgress($('#docid').val());
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
                            }
                        });
                        queryNo++;
                        var storedQueryNo = queryNo;

                        $http({
                            method: 'GET',
                            url: apiBase + '/document/' + encodeURIComponent($('#docid').val()) + '/token',
                            params: params,
                            headers: {
                                "Content-Type": "application/json"
                            }
                        }).success(function (data) {
                            if (queryNo === storedQueryNo) {
                                callback(data);
                            }
                        });
                    },
                    500);
        };



        $scope.httprequest = function (docid) {
            $scope.gridOptions.columnDefs = [];
            $scope.creategrid = true;
            $scope.refreshstats();
            var docId = $('#docid').val();
            $scope.tokenCount = 0;
            $scope.currentDocId = docId;
            $scope.apiBase = apiBase;

            $http({
                method: 'GET',
                url: apiBase + '/document/' + encodeURIComponent(docId) + '/token',
                params: {
                    _pageSize: $scope.gridOptions.paginationPageSize,
                    _offset: ($scope.gridOptions.paginationCurrentPage - 1) * $scope.gridOptions.paginationPageSize
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
                $scope.gridOptions.columnDefs.push(widgetFactory({
                    name: 'token',
                    typeId: ''
                }).registerInGrid($scope));
                $scope.properties = documents[docId].properties;
                $scope.batchEditProperties = {};
                _.forEach($scope.properties, function (value, key) {
                    if (value.readOnly === false) {
                        $scope.batchEditProperties[key] = value;
                    }
                });

                $.each(documents[docId].properties, function (key, value) {
                    var widget = widgetFactory(value);
                    $scope.gridOptions.columnDefs.push(widget.registerInGrid($scope));
                });
                $scope.states = documents[docId].properties;
                $scope.trackProgress(docId);
            });

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
                /*var countData = _.countBy($scope.gridOptions.data, function (item) {
                 return item.type;
                 });
                 angular.forEach(countData, function (key, item) {
                 $scope.labels.push(item);
                 $scope.data.push(key);
                 });
                 
                 $scope.labels;
                 $scope.data;*/
                $scope.getUserPrefs(docId);
            }

        };

        $scope.getUserPrefs = function (docid) {
            var docId = $('#docid').val();
            $scope.documentPrefs = {};
            $http({
                method: 'GET',
                url: apiBase + '/document/' + encodeURIComponent(docId) + '/preference',
                headers: {
                    "Content-Type": "application/json"
                }
            }).success(function (data) {

                if (typeof data === 'object') {
                    $scope.documentPrefs = data;
                }
            });
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
                    _.assign(o, {'percentage': (o.count / $scope.tokenCount * 100).toFixed(2)});
                });
                var diff = 0;
                var count = _.map(data, 'count');
                _.each(count, function (o) {
                    diff = diff + o;
                });

                unchecked.value = 'unchecked';

                unchecked.count = $scope.tokenCount - diff;
                unchecked.percentage = ((($scope.tokenCount - diff) / $scope.tokenCount) * 100).toFixed(2);
                $scope.stats.push(unchecked);






            });


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
    }
]);

app.controller("Stats", function ($scope) {
    $scope.$watch('stats', function () {
        $scope.$apply
    });
});


