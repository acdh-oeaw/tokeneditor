app.filter('calcPercentage', function () {
    return function (val) {
        return Math.round(val * 100).toFixed(2);
    }
});

app.filter('getIds', function () {
    return function (string,col) {
      
        string.split(" ").forEach(function (val) {
            col.push({"id":val});
        });
    }
});

app.filter('parseJSON', function () {
    return function (val) {
       return JSON.parse(val);
    }
});