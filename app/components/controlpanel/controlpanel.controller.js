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

function ControlPanelCtrl($uibModal, $document, $scope, $timeout, controlPanel, audioPlayer, resultRecorder, graphMarks) {
    var frequencyOptions = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000, 12000];
    var frequencyIndex = 0;
    var minStimulus = -10;
    var maxStimulus = 120;
    var stimulusStep = 5;
    var UP_KEY = 38,
        DOWN_KEY = 40,
        LEFT_KEY = 37,
        RIGHT_KEY = 39,
        SPACE_KEY = 32,
        ENTER_KEY = 13,
        D_KEY = 68;
    var vm = this;

    vm.getEarSide = controlPanel.getSide; // 0 for left ear and 1 for right ear
    vm.setEarSide = controlPanel.setSide;
    vm.getFrequency = controlPanel.getFrequency;
    vm.decreaseFrequency = decreaseFrequency;
    vm.increaseFrequency = increaseFrequency;
    vm.getStimulus = controlPanel.getStimulus;
    vm.decreaseStimulus = decreaseStimulus;
    vm.increaseStimulus = increaseStimulus;
    vm.openCalibration = openCalibration;
    vm.openAutoTest = openAutoTest;
    vm.openManualTest = openManualTest;
    vm.recordResult = recordResult;
    vm.endManualTest = endManualTest;
    vm.presentTone = presentTone;
    vm.isPlaying = false;

    setHotKeys();

    /**
     * Decreases the frequency to the next lower frequency option.
     */
    function decreaseFrequency() {
        frequencyIndex = Math.max(0, frequencyIndex - 1);
        var newFrequency = frequencyOptions[frequencyIndex];
        controlPanel.setFrequency(newFrequency);
        if (vm.isManualTesting) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    /**
     * Increases the frequency to the next higher frequency option.
     */
    function increaseFrequency() {
        frequencyIndex = Math.min(frequencyOptions.length - 1, frequencyIndex + 1);
        var newFrequency = frequencyOptions[frequencyIndex];
        controlPanel.setFrequency(newFrequency);
        if (vm.isManualTesting) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    /**
     * Decreases the stimulus to the next lower stimulus option.
     */
    function decreaseStimulus() {
        var currentStimulus = controlPanel.getStimulus();
        var newStimulus = Math.max(minStimulus, currentStimulus - stimulusStep);
        controlPanel.setStimulus(newStimulus);
        if (vm.isManualTesting) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    /**
     * Increases the stimulus to the next higher stimulus option.
     */
    function increaseStimulus() {
        var currentStimulus = controlPanel.getStimulus();
        var newStimulus = Math.min(maxStimulus, currentStimulus + stimulusStep);
        controlPanel.setStimulus(newStimulus);
        if (vm.isManualTesting) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

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
        graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
    }

    /********************************/
    /*** Manual Hearing Test Code ***/

    /**
     * Sets keyboard listener for manual hearing test
     */
    function setHotKeys() {
        $document.bind('keydown', function(event) {
            if (vm.isManualTesting) {
                if (event.keyCode == LEFT_KEY) decreaseFrequency();
                if (event.keyCode == RIGHT_KEY) increaseFrequency();
                if (event.keyCode == DOWN_KEY) decreaseStimulus();
                if (event.keyCode == UP_KEY) increaseStimulus();
                if (event.keyCode == SPACE_KEY) presentTone();
                if (event.keyCode == ENTER_KEY) recordResult();
                if (event.keyCode == D_KEY) endManualTest();
                $scope.$apply();
            }
        });
    }

    /**
     * Records the result of a manual test
     */
    function recordResult() {
        graphMarks.popMark();
        resultRecorder.addResult(controlPanel.getFrequency(),
                                 controlPanel.getStimulus(),
                                 controlPanel.getSide());
        graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
    }

    /**
     * Ends the manual test and removes the cursor mark
     */
    function endManualTest() {
        graphMarks.popMark();
        vm.isManualTesting = false;
    }

    /**
     * Plays the tone for the manual test
     */
    function presentTone() {
        var frequency = controlPanel.getFrequency();
        var level = controlPanel.getStimulus();
        var timeInSeconds = 1;
        var ear = controlPanel.getSide();
        vm.isPlaying = true;
        audioPlayer.playTone(frequency, timeInSeconds, level, ear);
        $timeout(function() {
            vm.isPlaying = false;
        }, timeInSeconds * 1000);
    }

}
