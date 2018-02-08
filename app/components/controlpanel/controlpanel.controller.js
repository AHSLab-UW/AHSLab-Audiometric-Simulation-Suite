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
    var minStimulus = -10,
        minMasker = -10;
    var maxStimulus = 120,
        maxMasker = 120;
    var stimulusStep = 5,
        maskerStep = 5;
    var UP_KEY = 38,
        DOWN_KEY = 40,
        LEFT_KEY = 37,
        RIGHT_KEY = 39,
        SPACE_KEY = 32,
        ENTER_KEY = 13,
        R_KEY = 82,
        D_KEY = 68,
        C_KEY = 67,
        M_KEY = 77,
        E_KEY = 69;

    var vm = this;
    vm.side = controlPanel.getSide();
    vm.masker = controlPanel.getMasking();
    vm.response = controlPanel.getResponse();
    console.log(vm.masker);
    vm.conduction = controlPanel.getConduction();
    vm.isPlaying = false;
    vm.isSimulated = false;
    vm.simulatedResponse = false;
    vm.isGraphMaker = false;
    vm.getConduction = controlPanel.getConduction;
    vm.setConduction = controlPanel.setConduction;
    vm.getEarSide = controlPanel.getSide;
    vm.setEarSide = controlPanel.setSide;
    vm.getMasking = controlPanel.getMasking;
    vm.setMasking = controlPanel.setMasking;
    vm.getResponse = controlPanel.getResponse;
    vm.setResponse = controlPanel.setResponse;
    vm.getFrequency = controlPanel.getFrequency;
    vm.decreaseFrequency = decreaseFrequency;
    vm.increaseFrequency = increaseFrequency;
    vm.getStimulus = controlPanel.getStimulus;
    vm.decreaseStimulus = decreaseStimulus;
    vm.increaseStimulus = increaseStimulus;
    vm.getMaskerLevel = controlPanel.getMaskerLevel;
    vm.decreaseMaskerLevel = decreaseMaskerLevel;
    vm.increaseMaskerLevel = increaseMaskerLevel;
    vm.openCalibration = openCalibration;
    vm.openAutoTest = openAutoTest;
    vm.openAutoSimulated = openAutoSimulated;
    vm.openManualTest = openManualTest;
    vm.openManualSimulated = openManualSimulated;
    vm.recordResult = recordResult;
    vm.endManualTest = endManualTest;
    vm.endGraphMaker = endGraphMaker;
    vm.graphMakerOpened = false;
    vm.presentTone = presentTone;
    vm.openImport = openImport;
    vm.openExport = openExport;
    vm.clearData = clearData;
    vm.openGraphMaker = openGraphMaker;
    vm.cycleConduction = cycleConduction;
    vm.cycleEar = cycleEar;
    vm.cycleRes = cycleRes;

    setHotKeys();

    function decreaseFrequency() {
        frequencyIndex = Math.max(0, frequencyIndex - 1);
        var newFrequency = frequencyOptions[frequencyIndex];
        controlPanel.setFrequency(newFrequency);
        if (vm.isManualTesting||vm.isGraphMaker) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    function increaseFrequency() {

        frequencyIndex = Math.min(frequencyOptions.length - 1, frequencyIndex + 1);
        var newFrequency = frequencyOptions[frequencyIndex];
        controlPanel.setFrequency(newFrequency);
        if (vm.isManualTesting||vm.isGraphMaker) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    function decreaseStimulus() {
        var currentStimulus = controlPanel.getStimulus();
        var newStimulus = Math.max(minStimulus, currentStimulus - stimulusStep);
        controlPanel.setStimulus(newStimulus);
        if (vm.isManualTesting||vm.isGraphMaker) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    function increaseStimulus() {
        var currentStimulus = controlPanel.getStimulus();
        var newStimulus = Math.min(maxStimulus, currentStimulus + stimulusStep);
        controlPanel.setStimulus(newStimulus);
        if (vm.isManualTesting||vm.isGraphMaker) {
            graphMarks.popMark();
            graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
        }
    }

    function decreaseMaskerLevel() {
        var currentMaskerLevel = controlPanel.getMaskerLevel();
        var newMaskerLevel = Math.max(minMasker, currentMaskerLevel - maskerStep);
        controlPanel.setMaskerLevel(newMaskerLevel);
    }

    function increaseMaskerLevel() {
        var currentMaskerLevel = controlPanel.getMaskerLevel();
        var newMaskerLevel = Math.min(maxMasker, currentMaskerLevel + maskerStep);
        controlPanel.setMaskerLevel(newMaskerLevel);
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
                                          controlPanel.getConduction(),
                                          controlPanel.getResponse());
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

    function openGraphMaker() {
      if (!vm.graphMakerOpened){
        $uibModal.open({
          templateUrl: 'components/graphMakerTemplates/graphTemplate.html',
          controller: 'GraphMakerTemp',
          controllerAs: 'vm'
        });
      }
      vm.isGraphMaker = true;
      vm.graphMakerOpened = true;
      graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
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
            if (vm.isManualTesting ||vm.isGraphMaker) {
                if (event.keyCode == LEFT_KEY) decreaseFrequency();
                if (event.keyCode == RIGHT_KEY) increaseFrequency();
                if (event.keyCode == DOWN_KEY) decreaseStimulus();
                if (event.keyCode == UP_KEY) increaseStimulus();
                if (event.keyCode == SPACE_KEY && !vm.isGraphMaker) presentTone();
                if (event.keyCode == ENTER_KEY) recordResult();
                if (event.keyCode == C_KEY && vm.isGraphMaker) cycleConduction();
                if (event.keyCode == E_KEY && vm.isGraphMaker) cycleEar();
                if (event.keyCode == R_KEY && vm.isGraphMaker) cycleRes();
                if (event.keyCode == M_KEY && vm.isGraphMaker) cycleMasker();
                if (event.keyCode == D_KEY && vm.isGraphMaker){ endGraphMaker();}
                else if(event.keyCode == D_KEY && vm.isManualTesting){
                  endManualTest();
                }


                $scope.$apply();
            }
        });
    }

    function cycleEar(){
      vm.side = vm.side === 1 ? 0 : 1;
      controlPanel.setSide(vm.side);
    }
    function cycleRes(){
      vm.response = vm.response === 1 ? 0 : 1;
      controlPanel.setResponse(vm.response);
    }
    function cycleConduction(){
      vm.conduction = vm.conduction === 1 ? 0 : 1;
      controlPanel.setConduction(vm.conduction);
    }
    function cycleMasker(){
      vm.masker = vm.masker === 1 ? 0 : 1;
      controlPanel.setMasking(vm.masker);
    }

    function recordResult() {
      graphMarks.popMark(); // pop cursor mark
      graphMarks.pushResultMark(controlPanel.getFrequency(),
        controlPanel.getStimulus(),
        controlPanel.getSide(),
        controlPanel.getConduction(),
        controlPanel.getMasking(),
        controlPanel.getResponse());
      graphMarks.pushCursorMark(controlPanel.getFrequency(), controlPanel.getStimulus());
    }

    function endManualTest() {
        graphMarks.popMark(); // pop cursor mark
        vm.isManualTesting = false;
        vm.isSimulated = false;
        simulatedListener.setPatientData(false);
    }
    function endGraphMaker() {
      graphMarks.popMark(); // pop cursor mark
      vm.isManualTesting = false;
      vm.isSimulated = false;
      vm.isGraphMaker = false;
      simulatedListener.setPatientData(false);
    }

    function presentTone() {
        var timeInSeconds = 1;
        if (vm.isSimulated) {
            vm.simulatedResponse = simulatedListener.getResponse(controlPanel.getStimulus(),
                                                                 controlPanel.getFrequency(),
                                                                 controlPanel.getSide(),
                                                                 controlPanel.getConduction(),
                                                                 controlPanel.getMasking());
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
            var maskerLevel = controlPanel.getMaskerLevel();
            vm.isPlaying = true;
            if (controlPanel.getMasking() === configConstants.MASKING) {
                audioPlayer.playToneWithMasker(frequency, timeInSeconds, level, ear, maskerLevel);
            } else {
                audioPlayer.playTone(frequency, timeInSeconds, level, ear);
            }
            $timeout(function() {
                vm.isPlaying = false;
            }, timeInSeconds * 1000);
        }
    }

}
