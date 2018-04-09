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
    vm.placeholder = 'HearingTestResults';
    vm.place = place;
    vm.ext = '.csv';
    vm.hide = '';
    function exportData() {
        var filename = $('#filename').val();
        console.log(vm.exportType);
        var type = '';
        if (vm.exportType === 'all') {
            filename = filename.length > 0 ? filename : 'ExportedPackage';
            fileProcessor.exportAll(filename);
            return;
        }
        if (vm.exportType === 'csv') {
            filename = filename.length > 0 ? filename : 'HearingTestResults';
            type = 'csv';
        }
        if (vm.exportType === 'txt') {
          filename = filename.length > 0 ? filename : 'EncryptedResults';
            type = 'encrypted';
        }
        if (vm.exportType === 'png') {
          filename = filename.length > 0 ? filename : 'AudiogramResults';
            type = 'image';
        }

        fileProcessor.exportResults(filename, type);
    }

    function place(pos) {
        if (pos ===0) {
            vm.placeholder = 'Base filename';
            vm.hide = 'true';
            return;
        } else if (pos === 1){
            vm.placeholder = 'HearingTestResults';
            vm.ext = '.csv';
        } else if ( pos === 2){
            vm.placeholder = 'EncryptedResults';
            vm.ext = '.txt';
        } else {
            vm.placeholder = 'AudiogramResults';
            vm.ext = '.png';
        }
        vm.hide = '';
    }

    function close() {
        $uibModalInstance.close();
    }

}
