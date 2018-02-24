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
    player.playToneWithMasker = playToneWithMasker;

    return player;

    function playTone(frequency, timeInSeconds, level, ear) {
        var source = audioContext.createBufferSource();
        level = convert(level,frequency);
        source.buffer = bufferGenerator.generateBuffer(frequency, timeInSeconds, level, ear);
        source.connect(audioContext.destination);
        source.start();
    }

    function playToneWithMasker(frequency, timeInSeconds, level, ear, maskerLevel) {
        var source = audioContext.createBufferSource();
        level = convert(level,frequency);
        source.buffer = bufferGenerator.generateBufferWithMasker(frequency, timeInSeconds, level, ear, maskerLevel);
        source.connect(audioContext.destination);
        source.start();
        // 125, 250, 500, 750,1000,1500,2000,3000,4000,6000,8000,12000
    }

    function convert(level,freq) {
      var dbSPL = {125: 45, 250:27,500:13.5,
                  750:9, 1000:7.5,1500:7.5,
                  2000:9, 3000:11.5,4000:12,
                  6000:16, 8000:15.5,12000:15.5};
      return level + dbSPL[freq]
    }
}
