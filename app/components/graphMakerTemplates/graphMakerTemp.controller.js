'use strict';

/**
 * @ngdoc function
 * @name hearingTestApp.controller:ImportCtrl
 * @description
 * # ImportCtrl
 * Handles user interaction for the import modal
 */
angular.module('hearingTestApp.graphMakerTemp')
  .controller('GraphMakerTemp', GraphCtrl);

function GraphCtrl($uibModalInstance, $window, fileProcessor) {
  var vm = this;
  vm.selection = selection;
  vm.close = close;

  function selection() {
    var selected = document.getElementsByClassName('active')[4].id;
    var filename = '';
    if(selected === '0'){
      close();
    }else if(selected === '1'){
      filename = 'MildBilateralConductiveHearingLoss';
    } else if(selected === '2'){
      filename = 'ModToSevereBilateralConductiveHearingLoss';
    } else if(selected === '3'){
      filename ='SevereUnilateralHearingLoss';
    }
    loadFiles(filename).then(function(response){
      var reader = new FileReader();
      reader.onloadend = function(e) {
        console.log('Type file ', response.type, e.target);
        if (response.type === 'text/csv') {
          if (fileProcessor.importResults(e.target.result, 'csv')) close();
          else $window.alert('Data is not properly formatted.');
        } else if (response.type === 'text') {
          if (fileProcessor.importResults(e.target.result, 'encrypted')) close();
          else $window.alert('Data is not properly formatted.');
        } else {
          if (fileProcessor.importResults(e.target.result, 'csv')) close();
          //$window.alert('Must upload .csv or .txt file');
        }
      };
      reader.readAsText(response);
    });
  }

  function loadFiles(filename) {
    var base = 'audiograms/';
    var url2 = base + filename + '.csv';
    console.log(url2);
    return new Promise(function (resolve, reject) {
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open('GET', url2 );
      xmlhttp.responseType = 'blob';
      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.status === 200 && xmlhttp.readyState === 4) {
          resolve(xmlhttp.response);
        }
      };
      xmlhttp.send();
    });

  }

  function close() {
    $uibModalInstance.close();
  }

}
