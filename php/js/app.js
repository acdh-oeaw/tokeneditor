/* global input */

var queryNo = 0;

var app = angular.module(
    'myApp', 
    ['ngSanitize', 'ui.grid', 'ui.grid.pagination','ui.grid.resizeColumns', 'ui.grid.edit', 'ui.grid.cellNav', 'ui.grid.exporter', 'chart.js', 'ui.grid.selection', 'ui.bootstrap']
);

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
        useExternalFiltering: true,
        columnDefs: [ ],
        
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
                        url: 'document/' + encodeURIComponent($('#docid').val()) + '/token/' + encodeURIComponent(rowEntity['tokenId']),
                        data: $.param(data),
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    });
                }
            });

            $scope.gridApi.core.on.sortChanged($scope, function (grid, sortColumns) {
            });

            gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                $scope.getData(function (data) {
                    $scope.flattened = [];
                    $scope.gridOptions.data = data.data;
                    $scope.gridOptions.totalItems = data.tokenCount;
                });
            });

            $scope.gridApi.core.on.filterChanged($scope, function(){
                $scope.getData(function(data){
                    $scope.flattened = [];
                    $scope.gridOptions.data = data.data;
                    $scope.gridOptions.totalItems = data.tokenCount;
                });
            });
        }
    };

    $scope.getDataTimeout = null;
    $scope.getData = function(callback){
        if($scope.getDataTimeout){
            clearTimeout($scope.getDataTimeout);
        }
        $scope.getDataTimeout = setTimeout(
            function(){
                var grid = $scope.gridApi.grid;
                var params = {
                    _pageSize: $scope.gridOptions.paginationPageSize,
                    _offset:   ($scope.gridOptions.paginationCurrentPage - 1) * $scope.gridOptions.paginationPageSize
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
                    url: 'document/' + encodeURIComponent($('#docid').val()) + '/token',
                    params: params,
                    headers: {"Content-Type": "application/json"}
                }).success(function(data){
                    if(queryNo === storedQueryNo){
                        callback(data);
                    }
                });
            }, 
            500
        );
    };
        
    $scope.httprequest = function (docid) {
        $scope.gridOptions.columnDefs = [];
        $scope.creategrid = true;
        $scope.refreshstats();
        var docId = $('#docid').val();

        $http({
            method: 'GET',
            url: 'document/' + encodeURIComponent(docId) + '/token',
            params: {
                _pageSize: $scope.gridOptions.paginationPageSize,
                _offset:   $scope.gridOptions.paginationCurrentPage
            },
            headers: {"Content-Type": "application/json"}
        }).success(function (data) {
            $scope.flattened = [];
            $scope.gridOptions.columnDefs = [];
            $scope.gridOptions.data = data.data;
            $scope.gridOptions.totalItems = data.tokenCount;
            
            $scope.gridOptions.columnDefs.push(widgetFactory({name: 'tokenId', typeId: ''}).registerInGrid($scope));
            $scope.gridOptions.columnDefs.push(widgetFactory({name: 'token', typeId: ''}).registerInGrid($scope));
            $.each(documents[docId].properties, function(key, value){
                var widget = widgetFactory(value);
                $scope.gridOptions.columnDefs.push(widget.registerInGrid($scope));
            });
        });

        $scope.filterOptions = {
            filterText: "",
            useExternalFilter: true
        };

        $scope.update = function (column, row, cellValue) {};

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
            var countData = _.countBy($scope.gridOptions.data, function (item) {
                return item.type;
            });
            angular.forEach(countData, function (key, item) {
                $scope.labels.push(item);
                $scope.data.push(key);
            });

            $scope.labels;
            $scope.data;

        }
    };

    $scope.refreshstats = function () {
        $scope.labels = [];
        $scope.data = [];
        countData = _.countBy($scope.gridOptions.data, function (item) {
            return item.type;
        });
        angular.forEach(countData, function (key, item) {

            $scope.labels.push(item);
            $scope.data.push(key);
        });

    };
}]);

app.controller("DoughnutCtrl", function ($scope) {
    $scope.labels;
    $scope.data;
});
