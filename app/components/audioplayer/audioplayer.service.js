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
        source.buffer = bufferGenerator.generateBuffer(frequency, timeInSeconds, level, ear);
        source.connect(audioContext.destination);
        source.start();
    }

    function playToneWithMasker(frequency, timeInSeconds, level, ear, maskerLevel) {
        var source = audioContext.createBufferSource();
        source.buffer = bufferGenerator.generateBufferWithMasker(frequency, timeInSeconds, level, ear, maskerLevel);
        source.connect(audioContext.destination);
        source.start();
    }

}
