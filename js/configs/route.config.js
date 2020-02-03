
angular
.module('tokenEditorApp')
.config(config);

function config($stateProvider, $urlRouterProvider, $locationProvider) {
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

    var statsState = {
        name: 'stats',
        url: '/stats/:documentId',
        templateUrl: 'templates/stats.html'
    }

    $locationProvider.html5Mode(true);
    $stateProvider.state(homeState);
    $stateProvider.state(editorState);
    $stateProvider.state(statsState);
    $stateProvider.state(documentationState);
}