'use strict';

/**
 * @ngdoc service
 * @name domToImage.domToImageFactory
 * @description
 * # domToImageFactory
 * Factory in the domToImage module
 */
angular.module('domToImage')
  .factory('domToImageFactory', domToImageFactory);

function domToImageFactory() {
    var factory= {};
    factory.getInstance = getInstance;
    return factory;

    function getInstance() {
        // using dom-to-image library which provides global object domtoimage
        return domtoimage;
    }

}
