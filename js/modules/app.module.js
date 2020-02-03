/* global input */

var queryNo = 0;

var app = angular.module(
    'tokenEditorApp',
    ['ngResource', 'ngSanitize','ngAnimate','ui.bootstrap','ui.grid', 'ui.grid.pagination', 'ui.grid.resizeColumns', 'ui.grid.edit', 'ui.grid.cellNav', 'ui.grid.exporter', 'ui.grid.selection','ui.grid.saveState', 'ui.router', 'ui.select', 'ngFileUpload']);

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


app.run(['$transitions', function ($transitions) {
    $transitions.onSuccess({}, function () {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    })
}]);