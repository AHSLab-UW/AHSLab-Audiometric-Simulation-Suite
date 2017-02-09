'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:bufferGenerator
 * @description
 * # bufferGenerator
 */
angular.module('hearingTestApp.bufferGenerator')
  .factory('bufferGenerator', bufferGenerator);

function bufferGenerator(webAudioContextFactory) {
  var audioContext = webAudioContextFactory.getInstance();
  var generator = {};

  generator.generateBuffer = generateBuffer;

  return generator;

  function generateBuffer(frequency, timeInSeconds, level, ear) {
    var channels = 2,
        sampleRate = audioContext.sampleRate,
        bufferLength = sampleRate * timeInSeconds,
        audioBuffer = audioContext.createBuffer(channels, bufferLength, sampleRate);

    var nowBuffering = audioBuffer.getChannelData(ear);
    for (var i = 0; i < bufferLength; i++) {
      nowBuffering[i] = calculateToneAtIndex(i, sampleRate, frequency, level);
    }

    return audioBuffer;
  }

  function calculateToneAtIndex(i, sampleRate, frequency, level) {
    var peakCalibrationValue = 0.01;
    var Lcalib = 60;
    var amplitude = peakCalibrationValue * Math.pow(10, (level-Lcalib)/20);
    return amplitude * Math.sin(2 * Math.PI * frequency * (i/sampleRate));
  }

}
