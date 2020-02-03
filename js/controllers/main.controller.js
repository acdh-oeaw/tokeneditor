app.controller('MainCtrl', ['$scope', '$http', '$timeout', '$state', 'DocumentsFactory', 'Upload', '$location', function ($scope, $http, $timeout, $state, DocumentsFactory, Upload, $location, $locationProvider) {

    $scope.getCurrentView = function() {
       return $state.current.name;
    }

    $scope.apiBase = apiBase;

    $scope.userLogin = new TokenEditorLogin(loginConfig);
    $scope.documentsLoading = DocumentsFactory.getLoading;

    $timeout(function () {
        $scope.userLogin.onLogin(function () {
            DocumentsFactory.retrieveDocuments().query().$promise.then(function (res) {
                DocumentsFactory.setDocuments(JSON.parse(angular.toJson(res)));
                $scope.documents = DocumentsFactory.getDocuments();
                DocumentsFactory.setLoading(false);
                
            });

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
            DocumentsFactory.retrieveDocuments().query().$promise.then(function (res) {
                DocumentsFactory.setDocuments(JSON.parse(angular.toJson(res)));
                $scope.documents = DocumentsFactory.getDocuments();
            });
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
