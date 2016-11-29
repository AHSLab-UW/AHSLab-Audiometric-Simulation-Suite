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

function AutomaticExerciseCtrl($timeout, controlPanel, webAudioContextFactory, resultRecorder) {
  var vm = this;
  var audioContext = webAudioContextFactory.getInstance();
  var visitMap = [];

  vm.stimulus = controlPanel.getStimulus();
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
    vm.stimulus = controlPanel.getStimulus();
    visitMap = [];
    iterateExercise('start');
  }

  /**
   * Iterate through the exercise based on the given response
   */
  function iterateExercise(response) {
    vm.hasResponded = true;
    if (response === 'yes') {
      if (updateVisitMap() === 3) {
        endExercise('success');
        return;
      } else {
        vm.stimulus = vm.stimulus - 10;
        controlPanel.setStimulus(vm.stimulus);
      }
    }
    if (response === 'no') {
      vm.stimulus = vm.stimulus + 5;
      controlPanel.setStimulus(vm.stimulus);
    }

    if (vm.stimulus > 100) {
      endExercise('abort');
    } else {
      $timeout(function() {
        playTone(controlPanel.getFrequency(), 1, vm.stimulus);
        vm.hasResponded = false;
      }, 1000);
    }
  }

  /**
   * End the exercise based on the given terminating condition
   */
  function endExercise(terminatingCondition) {
    vm.isInExercise = false;
    vm.hasResponded = false;
    if (terminatingCondition === 'success') {
      resultRecorder.addResult(controlPanel.getFrequency(), controlPanel.getStimulus());
    }
    vm.isAutoTesting = false;
  }

  /**
   * Record a stimulus level in the visitMap and return its count
   */
  function updateVisitMap() {
    var currentLevelCount = visitMap[vm.stimulus];
    if (isNaN(currentLevelCount)) {
      visitMap[vm.stimulus] = 1;
    } else {
      visitMap[vm.stimulus] = currentLevelCount + 1;
    }
    return visitMap[vm.stimulus];
  }

  /**
   * Play a tone given frequency, timeInSeconds, and stimulus level
   */
  function playTone(frequency, timeInSeconds, level) {
    var source = audioContext.createBufferSource();
    source.buffer = generateBuffer(frequency, timeInSeconds, level);
    source.connect(audioContext.destination);
    vm.isPlaying = true;
    source.start();
    $timeout(function() {
      vm.isPlaying = false;
    }, timeInSeconds*1000);
  }

  /**
   * Generate an audio buffer given frequency, timeInSeconds, and stimulus level
   */
  function generateBuffer(frequency, timeInSeconds, level) {
    var channels = 2,
        sampleRate = audioContext.sampleRate,
        bufferLength = sampleRate * timeInSeconds,
        audioBuffer = audioContext.createBuffer(channels, bufferLength, sampleRate);

    for (var ch = 0; ch < channels; ch++) {
      var nowBuffering = audioBuffer.getChannelData(ch);
      for (var i = 0; i < bufferLength; i++) {
        nowBuffering[i] = calculateToneAtIndex(i, sampleRate, frequency, level);
      }
    }

    return audioBuffer;
  }

  /**
   * Compute the value of the tone at a given location in the audio buffer
   */
  function calculateToneAtIndex(i, sampleRate, frequency, level) {
    var peakCalibrationValue = 0.01;
    var Lcalib = 60;
    var amplitude = peakCalibrationValue * Math.pow(10, (level-Lcalib)/20);
    return amplitude * Math.sin(2 * Math.PI * frequency * (i/sampleRate));
  }

}
