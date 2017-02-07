'use strict';

/**
 * @ngdoc function
 * @name hearingTestApp.controller:AutomaticExerciseCtrl
 * @description
 * # AutomaticExerciseCtrl
 * Handles user interaction for the automatic hearing test
 */
angular
    .module('hearingTestApp.automaticExercise')
    .controller('AutomaticExerciseCtrl', AutomaticExerciseCtrl);

function AutomaticExerciseCtrl($timeout, controlPanel, audioPlayer, graphMarks) {
  var vm = this;
  var stimulus = controlPanel.getStimulus();
  var earSide = controlPanel.getSide();
  var visitMap = [];
  var MAX_VISIT = 3,
      MAX_STIMULUS = 120,
      MIN_STIMULUS = -10,
      DECREMENT = -10,
      INCREMENT = 5,
      TONE_TIME_SECONDS = 1,
      DELAY_PLAY_SECONDS = 1;

  vm.isInExercise = false;
  vm.isPlaying = false;
  vm.hasResponded = false;
  vm.startExercise = startExercise;
  vm.iterateExercise = iterateExercise;
  vm.endExercise = endExercise;

  /**
   * Start the automatic hearing test
   */
  function startExercise() {
    vm.isInExercise = true;
    vm.hasResponded = false;
    stimulus = controlPanel.getStimulus();
    earSide = controlPanel.getSide();
    visitMap = [];
    iterateExercise('start');
  }

  /**
   * Iterate through the exercise based on the given response
   */
  function iterateExercise(response) {
    vm.hasResponded = true;
    if (response === 'yes') {
      if (updateVisitMap() === MAX_VISIT) {
        endExercise('success');
        return;
      } else {
        stimulus = Math.max(stimulus + DECREMENT, MIN_STIMULUS);
        controlPanel.setStimulus(stimulus);
      }
    }
    if (response === 'no') {
      stimulus = Math.min(stimulus + INCREMENT, MAX_STIMULUS);
      controlPanel.setStimulus(stimulus);
    }

    $timeout(function() {
      presentTone(controlPanel.getFrequency(), TONE_TIME_SECONDS, stimulus, earSide);
      vm.hasResponded = false;
    }, DELAY_PLAY_SECONDS * 1000);
  }

  /**
   * End the exercise based on the given terminating condition
   */
  function endExercise(terminatingCondition) {
    vm.isInExercise = false;
    vm.hasResponded = false;
    if (terminatingCondition === 'success') {
      graphMarks.pushResultMark(controlPanel.getFrequency(),
                                controlPanel.getStimulus(),
                                earSide);
    }
    vm.isAutoTesting = false;
  }

  /**
   * Record a stimulus level in the visitMap and return its count
   */
  function updateVisitMap() {
    var currentLevelCount = visitMap[stimulus];
    if (isNaN(currentLevelCount)) {
      visitMap[stimulus] = 1;
    } else {
      visitMap[stimulus] = currentLevelCount + 1;
    }
    return visitMap[stimulus];
  }

  /**
   * Play a tone given frequency, timeInSeconds, stimulus level, and ear side
   */
  function presentTone(frequency, timeInSeconds, level, ear) {
    vm.isPlaying = true;
    audioPlayer.playTone(frequency, timeInSeconds, level, ear);
    $timeout(function() {
      vm.isPlaying = false;
    }, timeInSeconds * 1000);
  }

}
