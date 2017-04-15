(function () {

    'use strict';

    /**
     * @ngdoc service
     * @name mathjs.mathjsInstanceFactory
     * @description
     * # mathjsInstanceFactory
     * Factory for getting an instance of mathjs library.
     */
    angular.module('mathjs')
        .factory('mathjsInstanceFactory', mathjsInstanceFactory);

    /** @ngInject */
    function mathjsInstanceFactory() {
        var factory = {};
        factory.getInstance = getInstance;
        return factory;

        function getInstance() {
            return math;
        }
    }

}());
