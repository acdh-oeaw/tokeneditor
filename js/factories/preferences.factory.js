app.factory('PreferencesFactory', ['$resource', function ($resource) {
    var factory = {
        Preferences: [],
        loading: false,
        retrievePreferences: function (docid,preferenceId) {
            var preferencesEndpoint = preferenceId ?  apiBase + '/document/' + docid +  '/preference/' + preferenceId :  apiBase + '/document/' + docid +  '/preference';
            var isArray = preferenceId ? false : true;
            factory.loading = true;
            return $resource(preferencesEndpoint, {}, {
                  query: {
                      method: 'GET',
                      isArray: isArray
                  }
              });
          },
          storePreference: function(docid) {
            return $resource(apiBase + '/document/' + docid +  '/preference/', {}, {
                save: {
                    method: 'POST'
                }
            });
          },
          setLoading: function(bool){
            factory.loading = bool;
          },
          getLoading: function(){
            return factory.loading;
          },
          setPreferences: function(prefs) {
              factory.Preferences = prefs;
          },
          getPreferences: function(){
              return factory.Preferences;
          }
    }
    return factory;
}]);