'use strict';

/**
 * @ngdoc service
 * @name cryptoLibrary.cryptoLibraryFactory
 * @description
 * # cryptoLibraryFactory
 * Factory in the cryptoLibrary module
 */
angular.module('cryptoLibrary')
  .factory('cryptoLibraryFactory', cryptoLibraryFactory);

function cryptoLibraryFactory() {
    var factory= {};
    factory.getInstance = getInstance;
    return factory;

    function getInstance() {
        // using Stanford Javascript Crypto Library
        // provides global object sjcl
        return sjcl;
    }

}
