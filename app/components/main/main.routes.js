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
  .module('hearingTestApp.main')
  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'components/main/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
       });
  });
