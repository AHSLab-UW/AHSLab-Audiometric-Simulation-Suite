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
  .module('hearingTestApp.about')
  .config(function($routeProvider) {
    $routeProvider
      .when('/about', {
        templateUrl: 'components/about/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
       });
  });
