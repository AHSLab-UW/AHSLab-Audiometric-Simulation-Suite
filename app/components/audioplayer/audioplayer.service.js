'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:audioPlayer
 * @description
 * # audioPlayer
 */
angular.module('hearingTestApp.audioPlayer')
  .factory('audioPlayer', audioPlayer);

function audioPlayer(webAudioContextFactory, bufferGenerator) {
  var audioContext = webAudioContextFactory.getInstance();
  var player = {};

  player.playTone = playTone;

  return player;

  /**
   * Play a tone with a given frequency, time, level, and ear side
   */
  function playTone(frequency, timeInSeconds, level, ear) {
      var source = audioContext.createBufferSource();
      source.buffer = bufferGenerator.generateBuffer(frequency, timeInSeconds, level, ear);
      source.connect(audioContext.destination);
      source.start();
  }

}
