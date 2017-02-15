'use strict';

/**
 * @ngdoc function
 * @name hearingTestApp.controller:ImportCtrl
 * @description
 * # ImportCtrl
 * Handles user interaction for the import modal
 */
angular.module('hearingTestApp.import')
  .controller('ImportCtrl', ImportCtrl);

function ImportCtrl($uibModalInstance, fileProcessor) {
    var vm = this;
    vm.importData = importData;
    vm.close = close;

    function importData() {
        var file = document.getElementById('fileSelect').files[0];
        var reader = new FileReader();
        reader.onloadend = function(e) {
            if (fileProcessor.importCSV(e.target.result)) close();
        };
        reader.readAsText(file);
    }

    function close() {
        $uibModalInstance.close();
    }

}
