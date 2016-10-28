'use strict';

/**
 * @ngdoc function
 * @name hearingTestApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the hearingTestApp
 */
angular.module('hearingTestApp.main')
  .controller('MainCtrl', MainCtrl);

function MainCtrl($uibModal) {
    var vm = this;

    vm.openCalibration = openCalibration;

    function openCalibration() {
        $uibModal.open({
            templateUrl: 'components/calibration/calibration.html',
            controller: 'CalibrationCtrl',
            controllerAs: 'vm'
        });
    }

}
