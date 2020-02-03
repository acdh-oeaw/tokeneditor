app.controller('StatsCtrl', ['$scope', '$http', '$timeout', '$state', 'DocumentsFactory', 'StatsFactory', '$location', function ($scope, $http, $timeout, $state, DocumentsFactory, StatsFactory, $locationProvider, $location) {
    
    $scope.currentDocumentId = parseInt($state.params.documentId);
    
    DocumentsFactory.setCurrentDocument($scope.currentDocumentId);
    
    $scope.currentDocument = DocumentsFactory.getCurrentDocument();
    $scope.currentDocumentProperties = _.values($scope.currentDocument.properties);

    $scope.refreshStats = function(docid,propertyname){
        StatsFactory.retrieveStats(docid,propertyname).query().$promise.then(function (res) {
            StatsFactory.setStats(JSON.parse(angular.toJson(res)));
            $scope.documentStats = StatsFactory.getStats();
            StatsFactory.setLoading(false);
        });
    }
}]);