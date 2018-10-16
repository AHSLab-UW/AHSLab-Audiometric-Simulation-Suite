'use strict';

/**
 * @ngdoc overview
 * @name hearingTestApp
 * @description
 * # hearingTestApp
 *
 * Routes of the application.
 */
angular
  .module('hearingTestApp')
  .config(function($routeProvider) {
    $routeProvider
      .otherwise({
        redirectTo: '/'
       });
  });

// test for will
