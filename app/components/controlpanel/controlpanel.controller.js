'use strict';

/**
 * @ngdoc function
 * @name hearingTestApp.controller:ControlPanelCtrl
 * @description
 * # ControlPanelCtrl
 * Handles user interaction for the ControlPanel
 */
angular
    .module('hearingTestApp.controlPanel')
    .controller('ControlPanelCtrl', ControlPanelCtrl);

function ControlPanelCtrl($uibModal, controlPanel, webAudioContextFactory, resultRecorder, bufferGenerator) {
    var frequencyOptions = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 12000];
    var frequencyIndex = 0;
    var minStimulus = -10;
    var maxStimulus = 120;
    var stimulusStep = 5;
    var audioContext = webAudioContextFactory.getInstance();
    var vm = this;

    vm.openCalibration = openCalibration;
    vm.openAutoTest = openAutoTest;
    vm.openManualTest = openManualTest;
    vm.endManualTest = endManualTest;
    vm.presentTone = presentTone;
    vm.getEarSide = controlPanel.getSide; // 0 for left ear and 1 for right ear
    vm.setEarSide = controlPanel.setSide;
    vm.getFrequency = controlPanel.getFrequency;
    vm.decreaseFrequency = decreaseFrequency;
    vm.increaseFrequency = increaseFrequency;
    vm.getStimulus = controlPanel.getStimulus;
    vm.decreaseStimulus = decreaseStimulus;
    vm.increaseStimulus = increaseStimulus;

    /**
     * Opens the calibration modal.
     */
    function openCalibration() {
        $uibModal.open({
            templateUrl: 'components/calibration/calibration.html',
            controller: 'CalibrationCtrl',
            controllerAs: 'vm'
        });
    }

    /**
     * Sets the testing flags for the automatic test
     */
    function openAutoTest() {
        vm.isAutoTesting = true;
        vm.isManualTesting = false;
    }

    /**
     * Sets the testing flags for the manual test
     */
    function openManualTest() {
        vm.isManualTesting = true;
        vm.isAutoTesting = false;
    }

    function endManualTest(status) {
        vm.isManualTesting = false;
        if (status === 'success') {
            resultRecorder.addResult(controlPanel.getFrequency(),
                                     controlPanel.getStimulus(),
                                     controlPanel.getSide());
        }
    }

    function presentTone() {
        var source = audioContext.createBufferSource();
        var frequency = controlPanel.getFrequency();
        var level = controlPanel.getStimulus();
        var timeInSeconds = 1;
        var ear = controlPanel.getSide();
        source.buffer = bufferGenerator.generateBuffer(frequency, timeInSeconds, level, ear);
        source.connect(audioContext.destination);
        source.start();
    }

    /**
     * Decreases the frequency to the next lower frequency option.
     */
    function decreaseFrequency() {
        frequencyIndex = Math.max(0, frequencyIndex - 1);
        var newFrequency = frequencyOptions[frequencyIndex];
        controlPanel.setFrequency(newFrequency);
    }

    /**
     * Increases the frequency to the next higher frequency option.
     */
    function increaseFrequency() {
        frequencyIndex = Math.min(frequencyOptions.length - 1, frequencyIndex + 1);
        var newFrequency = frequencyOptions[frequencyIndex];
        controlPanel.setFrequency(newFrequency);
    }

    /**
     * Decreases the stimulus to the next lower stimulus option.
     */
    function decreaseStimulus() {
        var currentStimulus = controlPanel.getStimulus();
        var newStimulus = Math.max(minStimulus, currentStimulus - stimulusStep);
        controlPanel.setStimulus(newStimulus);
    }

    /**
     * Increases the stimulus to the next higher stimulus option.
     */
    function increaseStimulus() {
        var currentStimulus = controlPanel.getStimulus();
        var newStimulus = Math.min(maxStimulus, currentStimulus + stimulusStep);
        controlPanel.setStimulus(newStimulus);
    }
}
