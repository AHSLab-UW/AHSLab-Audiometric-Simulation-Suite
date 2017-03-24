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

function ControlPanelCtrl($uibModal, $document, $scope, $timeout, $window,
                          controlPanel, audioPlayer, graphMarks, configConstants, simulatedListener) {
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
    vm.isPlaying = false;
    vm.isSimulated = false;
    vm.simulatedResponse = false;
    vm.getConduction = controlPanel.getConduction;
    vm.setConduction = controlPanel.setConduction;
    vm.getEarSide = controlPanel.getSide;
    vm.setEarSide = controlPanel.setSide;
    vm.getFrequency = controlPanel.getFrequency;
    vm.decreaseFrequency = decreaseFrequency;
    vm.increaseFrequency = increaseFrequency;
    vm.getStimulus = controlPanel.getStimulus;
    vm.decreaseStimulus = decreaseStimulus;
    vm.increaseStimulus = increaseStimulus;
    vm.openCalibration = openCalibration;
    vm.openAutoTest = openAutoTest;
    vm.openAutoSimulated = openAutoSimulated;
    vm.openManualTest = openManualTest;
    vm.openManualSimulated = openManualSimulated;
    vm.recordResult = recordResult;
    vm.endManualTest = endManualTest;
    vm.presentTone = presentTone;
    vm.openImport = openImport;
    vm.openExport = openExport;
    vm.clearData = clearData;

    setHotKeys();

    function decreaseFrequency() {
        frequencyIndex = Math.max(0, frequencyIndex - 1);
        var newFrequency = frequencyOptions[frequencyIndex];
        controlPanel.setFrequency(newFrequency);
        if (vm.isManualTesting) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    function increaseFrequency() {
        frequencyIndex = Math.min(frequencyOptions.length - 1, frequencyIndex + 1);
        var newFrequency = frequencyOptions[frequencyIndex];
        controlPanel.setFrequency(newFrequency);
        if (vm.isManualTesting) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    function decreaseStimulus() {
        var currentStimulus = controlPanel.getStimulus();
        var newStimulus = Math.max(minStimulus, currentStimulus - stimulusStep);
        controlPanel.setStimulus(newStimulus);
        if (vm.isManualTesting) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    function increaseStimulus() {
        var currentStimulus = controlPanel.getStimulus();
        var newStimulus = Math.min(maxStimulus, currentStimulus + stimulusStep);
        controlPanel.setStimulus(newStimulus);
        if (vm.isManualTesting) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    function openAutoTest() {
        if (controlPanel.getConduction() === configConstants.BC) {
            $window.alert(configConstants.BC_WARNING_AUTO);
        } else {
            vm.isAutoTesting = true;
            vm.isManualTesting = false;
        }
    }

    function openAutoSimulated() {
        $uibModal.open({
            templateUrl: 'components/import/importsimulated.html',
            controller: 'ImportCtrl',
            controllerAs: 'vm'
        }).result.then(function() {
            var patientLevel = simulatedListener.levelForPatient(controlPanel.getFrequency(),
                                                                 controlPanel.getSide(),
                                                                 controlPanel.getConduction());
            if (patientLevel !== false) {
                graphMarks.pushResultMark(controlPanel.getFrequency(),
                                          patientLevel,
                                          controlPanel.getSide(),
                                          controlPanel.getConduction());
                simulatedListener.setPatientData(false);
            } else {
                $window.alert('No data to determine simulated result for current parameters.');
            }
        });
    }

    function openManualTest() {
        if (controlPanel.getConduction() === configConstants.BC) {
            $window.alert(configConstants.BC_WARNING_MANUAL);
        }
        vm.isManualTesting = true;
        vm.isAutoTesting = false;
        graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
    }

    function openManualSimulated() {
        $uibModal.open({
            templateUrl: 'components/import/importsimulated.html',
            controller: 'ImportCtrl',
            controllerAs: 'vm'
        }).result.then(function() {
            var patientData = simulatedListener.getPatientData();
            if (patientData !== false) {
                vm.isSimulated = true;
                openManualTest();
            }
        });
    }

    function openCalibration() {
        $uibModal.open({
            templateUrl: 'components/calibration/calibration.html',
            controller: 'CalibrationCtrl',
            controllerAs: 'vm'
        });
    }

    function openImport() {
        $uibModal.open({
            templateUrl: 'components/import/import.html',
            controller: 'ImportCtrl',
            controllerAs: 'vm'
        });
    }

    function openExport() {
        $uibModal.open({
            templateUrl: 'components/export/export.html',
            controller: 'ExportCtrl',
            controllerAs: 'vm'
        });
    }

    function clearData() {
        graphMarks.clearMarks();
    }

    /********************************/
    /*** Manual Hearing Test Code ***/

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

    function recordResult() {
        graphMarks.popMark(); // pop cursor mark
        graphMarks.pushResultMark(controlPanel.getFrequency(),
                                  controlPanel.getStimulus(),
                                  controlPanel.getSide(),
                                  controlPanel.getConduction());
        graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
    }

    function endManualTest() {
        graphMarks.popMark(); // pop cursor mark
        vm.isManualTesting = false;
        vm.isSimulated = false;
        simulatedListener.setPatientData(false);
    }

    function presentTone() {
        var timeInSeconds = 1;
        if (vm.isSimulated) {
            vm.simulatedResponse = simulatedListener.getResponse(controlPanel.getStimulus(),
                                                                 controlPanel.getFrequency(),
                                                                 controlPanel.getSide(),
                                                                 controlPanel.getConduction());
            vm.isPlaying = true;
            $timeout(function() {
                vm.isPlaying = false;
            }, timeInSeconds * 1000);
            return;
        }
        if (controlPanel.getConduction() === configConstants.AC) {
            var frequency = controlPanel.getFrequency();
            var level = controlPanel.getStimulus();
            var ear = controlPanel.getSide();
            vm.isPlaying = true;
            audioPlayer.playTone(frequency, timeInSeconds, level, ear);
            $timeout(function() {
                vm.isPlaying = false;
            }, timeInSeconds * 1000);
        }
    }

}
