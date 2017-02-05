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

function MainCtrl(graphMarks) {
    var vm = this;

    vm.isAutoTesting = false;
    vm.isManualTesting = false;
    vm.clearData = clearData;

    function clearData() {
        graphMarks.clearMarks();
    }
}
