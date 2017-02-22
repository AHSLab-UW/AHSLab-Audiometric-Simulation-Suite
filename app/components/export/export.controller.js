'use strict';

/**
 * @ngdoc function
 * @name hearingTestApp.controller:ExportCtrl
 * @description
 * # ExportCtrl
 * Handles user interaction for the export modal
 */
angular.module('hearingTestApp.export')
    .controller('ExportCtrl', ExportCtrl);

function ExportCtrl($uibModalInstance, fileProcessor) {
    var vm = this;
    vm.exportType = 'csv';
    vm.exportData = exportData;
    vm.close = close;

    function exportData() {
        if (vm.exportType === 'csv') {
            fileProcessor.exportToCSV('HearingTestResults.csv');
        }
        if (vm.exportType === 'bson') {
            console.log('bson');
        }
        if (vm.exportType === 'png') {
            fileProcessor.exportToPNG('AudiogramResults.png');
        }
    }

    function close() {
        $uibModalInstance.close();
    }

}
