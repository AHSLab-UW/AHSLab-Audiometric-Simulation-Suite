(function () {

  'use strict';

  /**
   * @ngdoc directive
   * @name hearingTestApp.directive:calibration
   * @description
   * # calibration
   * Calibrates the user machine's volume before the experiment starts.
   */
  angular.module('hearingTestApp.calibration')
    .directive('calibration', calibration);

  /** @ngInject */
  function calibration() {
    return {
      templateUrl: 'components/calibration/calibration.html',
      scope: {},
      restrict: 'E',
      transclude: true,
      replace: true,
      controller: 'CalibrationCtrl',
      controllerAs: 'vm',
      bindToController: true
    };
  }

}());
