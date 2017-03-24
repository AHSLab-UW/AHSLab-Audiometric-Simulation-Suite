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

function ImportCtrl($uibModalInstance, $window, fileProcessor) {
    var vm = this;
    vm.importData = importData;
    vm.close = close;

    function importData() {
        var file = document.getElementById('fileSelect').files[0];
        var fileType = getFileType(file);
        var reader = new FileReader();
        reader.onloadend = function(e) {
            if (fileType === '.csv') {
                if (fileProcessor.importResults(e.target.result, 'csv')) close();
                else $window.alert('Data is not propertly formatted.');
            } else if (fileType === '.txt') {
                if (fileProcessor.importResults(e.target.result, 'encrypted')) close();
                else $window.alert('Data is not propertly formatted.');
            } else {
                $window.alert('Must upload .csv or .txt file');
            }
        };
        reader.readAsText(file);
    }

    function getFileType(file) {
        var filename = file.name;
        var startOfExtension = filename.length - 4;
        return filename.substring(startOfExtension);
    }

    function close() {
        $uibModalInstance.close();
    }

}
