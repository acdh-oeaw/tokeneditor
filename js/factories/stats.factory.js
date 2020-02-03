angular.module('tokenEditorApp').factory('StatsFactory', ['$resource', function ($resource) {
    var factory = {
        Stats: [],
        loading: false,
        retrieveStats: function (docid,propertyname) {
            factory.loading = true;
            return $resource(apiBase + '/document/' + docid +  '/token', {}, {
                  query: {
                      method: 'GET',
                      isArray: true,
                      params: {
                        "_stats":propertyname
                      }
                  }
              });
          },
          setLoading: function(bool){
            factory.loading = bool;
          },
          getLoading: function(){
            return factory.loading;
          },
          setStats: function(stats) {
              factory.Stats = stats;
          },
          getStats: function(){
              return factory.Stats;
          }
    }
    return factory;
}]);