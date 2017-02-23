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
            fileProcessor.exportResults('HearingTestResults.csv', 'csv');
        }
        if (vm.exportType === 'txt') {
            fileProcessor.exportResults('EncryptedResults.txt', 'encrypted');
        }
        if (vm.exportType === 'png') {
            fileProcessor.exportResults('AudiogramResults.png', 'image');
        }
    }

    function close() {
        $uibModalInstance.close();
    }

}
