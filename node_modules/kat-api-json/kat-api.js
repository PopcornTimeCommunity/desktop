/*
 * kat-api.js
 * Provides a simple module for fetching data from 
 * Kickass Torrents' JSON API.
 */
(function(){
  
  //Required dependencies.
  var request = require("request");

  //List of Kickass access urls.
  var kickassUrls = [
    'https://kat.cr/'
  ];
  
  this.mostPopular = function(args,callback) {
    
    var key, requestUri;

    //Set default parameters.
    var parameters = {
      category: "movies",
      order: "seeders",
      sort: "desc",
      page: 1
    };

    //Override with user parameters.
    for ( key in args ) {
      parameters[key] = args[key];
    }
    
    //Generate the URL to request.
    requestUri = this.generateRequestUri(parameters);
    
    //Make the request.
    request(requestUri, function(err, res, body) {

      var jsonResults;

      //Catch errors.
      if (err) {
        callback(err);
        return false;
      }
      
      //Catch server error.
      if ( res.statusCode !== 200 ) {
        callback(new Error("Unsafe status code ( " + res.statusCode + ")  when making request to " + requestUri));
        return false;
      }

      try {
        jsonResults = JSON.parse(body);
      } catch(e) {
        callback(e);
        return false;
      }
      
      callback(null,jsonResults);

    });


  };

  this.generateRequestUri = function(args,q) {
   
    var translations = {
      category: ":",
      order: "field=",
      sort: "sorter=",
      page: "page="
    };

    var key, uri = this.getBaseUri();
    
    if ( typeof q !== "undefined" ) {
      uri = uri + q;
    }

    for( key in args ) {
      if ( translations.hasOwnProperty(key) ) {
        uri = uri + translations[key] + args[key] + "&";
      } else {
        uri = uri + args[key] + "&";
      }
    }

    return uri;

  };

  this.getBaseUri = function() {
    
    return kickassUrls[0] + "json.php?q=";

  };

  module.exports = this;

})();
