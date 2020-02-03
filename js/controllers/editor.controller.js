/* Controller for the editing interface which contains the grid and the tokeneditor widgets */
app.controller('EditorCtrl', ['$scope', '$http', '$timeout', '$state', 'DocumentsFactory', 'StatsFactory', 'PreferencesFactory', '$location', function ($scope, $http, $timeout, $state, DocumentsFactory, StatsFactory, PreferencesFactory, $locationProvider, $location) {


    $scope.currentDocumentId = parseInt($state.params.documentId);
    DocumentsFactory.setCurrentDocument($scope.currentDocumentId);

    $scope.currentDocument = DocumentsFactory.getCurrentDocument();
    $scope.currentDocumentProperties = _.values($scope.currentDocument.properties);

  /*  PreferencesFactory.retrievePreferences($scope.currentDocumentId).query().$promise.then(function (res) {
        var prefs = angular.toJson(res);
        if (!prefs.gridState) {
            prefs.gridState = {};
            PreferencesFactory.storePreference($scope.currentDocumentId).$save({'gridState':{}});
        }
        
        PreferencesFactory.setPreferences(prefs);
    });*/

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
                    if (!_.isArray(newValue)) {
                        data.value = newValue;
                    } else {
                        data.value = newValue.join(" ");
                    }
                    

                    $scope.$apply();
                    $http({
                        method: 'PUT',
                        url: apiBase + '/document/' + $scope.currentDocumentId + '/token/' + encodeURIComponent(rowEntity['tokenId']),
                        data: $.param(data),
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }).success(function () {

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

            $scope.gridApi.core.on.sortChanged($scope, function (grid, sortColumns) { });

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
            $scope.gridApi.colResizable.on.columnSizeChanged($scope, function (colDef, deltaChange) {
                console.log($scope.gridApi.saveState.save());
            });
        }
    };


    /* For the Stats Widget only Boolean, Closed List, Combo Box are smart to use, since main goal is tracking of the progress */
    $scope.filteredProperties = _.filter($scope.currentDocumentProperties, {
        'typeId': 'closed list'
    });

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
                    }).success(function () { }).error(handleError);

                }
            })

        });
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
  /*    if (! _.isEmpty($scope.documentPreferences.gridState)) {

        };   */
        
        $scope.gridOptions.columnDefs = [];
        $scope.creategrid = true;
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
        }).error(handleError);

        $scope.filterOptions = {
            filterText: "",
            useExternalFilter: true
        };

        $scope.update = function (column, row, cellValue) { };
        $scope.showPropertyValues = function (selected) {
            $scope.propertyValues = selected.values;
        }

        $scope.arrayOfChangedObjects = [];

        $scope.rowFormatter = function (row) {
            return row.entity.state === 's';
        };
       
    };
    $scope.statsLoading = StatsFactory.getLoading;

    $scope.refreshStats = function (docid, propertyname) {
        StatsFactory.retrieveStats(docid, propertyname).query().$promise.then(function (res) {
            StatsFactory.setStats(JSON.parse(angular.toJson(res)));
            $scope.documentStats = StatsFactory.getStats();
            StatsFactory.setLoading(false);
        });
    }
}]);