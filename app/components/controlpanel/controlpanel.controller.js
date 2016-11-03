'use strict';

/**
 * @ngdoc function
 * @name hearingTestApp.controller:ControlPanelCtrl
 * @description
 * # ControlPanelCtrl
 * Handles user interaction for the ControlPanel procedure
 */
angular
    .module('hearingTestApp.controlPanel')
    .controller('ControlPanelCtrl', ControlPanelCtrl);

function ControlPanelCtrl($uibModal) {
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
