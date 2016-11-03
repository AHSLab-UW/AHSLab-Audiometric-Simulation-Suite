(function () {

  'use strict';

  /**
   * @ngdoc directive
   * @name hearingTestApp.directive:simulator
   * @description
   * # simulator
   */
  angular.module('hearingTestApp.simulator')
    .directive('simulator', simulator);

  /** @ngInject */
  function simulator() {
    return {
      templateUrl: 'components/simulator/simulator.html',
      scope: {},
      restrict: 'E',
      replace: true,
      controller: 'SimulatorCtrl',
      controllerAs: 'vm',
      bindToController: true
    };
  }

}());
