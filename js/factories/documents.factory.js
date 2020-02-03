app.factory('DocumentsFactory', ['$resource', function ($resource) {
    var factory = {
        Documents: [],
        loading:false,
        currentDocument: {},
        retrieveDocuments: function () {
            factory.setLoading(true);
          return $resource(apiBase + '/document', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                }
            });
        },
        setLoading: function(bool){
            factory.loading = bool;
        },
        getLoading: function(){
            return factory.loading;
        },
        setDocuments: function(documents){
            factory.Documents = documents;
        },
        getDocuments: function () {
            return factory.Documents;
        },
        setCurrentDocument(docid) {
                factory.currentDocument  = _.find(factory.Documents,{'documentId':docid})
            
        },
        getCurrentDocument() {
            return factory.currentDocument
        }
    }
    return factory;
}]);