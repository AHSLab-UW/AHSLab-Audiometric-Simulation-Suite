'use strict';

/**
 * @ngdoc function
 * @name hearingTestApp.controller:CalibrationCtrl
 * @description
 * # CalibrationCtrl
 * Handles user interaction for the calibration procedure
 */
angular.module('hearingTestApp.calibration')
  .controller('CalibrationCtrl', CalibrationCtrl);

function CalibrationCtrl($uibModalInstance, webAudioContextFactory) {
  var audioContext = webAudioContextFactory.getInstance();
  var oscillator = audioContext.createOscillator();
  var gainNode = audioContext.createGain();

  var vm = this;
  vm.isPlaying = false;
  vm.startTone = startTone;
  vm.stopTone = stopTone;
  vm.close = close;

  setModalCloseAction(stopTone);

  function startTone() {
    vm.isPlaying = true;

    gainNode.gain.value = 0.01;
    oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 1000;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
  }

  function stopTone() {
    if (vm.isPlaying) {
      oscillator.stop();
      vm.isPlaying = false;
    }
  }

  function close() {
    $uibModalInstance.close();
  }

  function setModalCloseAction(action) {
    $uibModalInstance.result.finally(action);
  }

}
