'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:bufferGenerator
 * @description
 * # bufferGenerator
 */
angular.module('hearingTestApp.bufferGenerator')
    .factory('bufferGenerator', bufferGenerator);

function bufferGenerator(webAudioContextFactory, configConstants) {
    var audioContext = webAudioContextFactory.getInstance();
    var RAMP_SIZE = 1000;

    var generator = {};
    generator.generateBuffer = generateBuffer;
    generator.generateBufferWithMasker = generateBufferWithMasker;
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

        applyRamp(nowBuffering, RAMP_SIZE);
        return audioBuffer;
    }

    function generateBufferWithMasker(frequency, timeInSeconds, level, ear, maskerLevel) {
        var channels = 2,
            sampleRate = audioContext.sampleRate,
            bufferLength = sampleRate * timeInSeconds,
            audioBuffer = audioContext.createBuffer(channels, bufferLength, sampleRate);

        var toneBuffering = audioBuffer.getChannelData(ear);
        for (var i = 0; i < bufferLength; i++) {
            toneBuffering[i] = calculateToneAtIndex(i, sampleRate, frequency, level);
        }

        var otherSide;
        if (ear === configConstants.LEFT_EAR) otherSide = configConstants.RIGHT_EAR;
        else otherSide = configConstants.LEFT_EAR;

        var maskerBuffering = audioBuffer.getChannelData(otherSide);
        for (var i = 0; i < bufferLength; i++) {
            maskerBuffering[i] = calculateMaskerAtIndex(i, sampleRate, frequency, maskerLevel);
        }

        applyRamp(toneBuffering, RAMP_SIZE);
        applyRamp(maskerBuffering, RAMP_SIZE);
        return audioBuffer;
    }

    function calculateToneAtIndex(i, sampleRate, frequency, level) {
        var peakCalibrationValue = 0.01;
        var Lcalib = 60;
        var amplitude = peakCalibrationValue * Math.pow(10, (level-Lcalib)/20);
        return amplitude * Math.sin(2 * Math.PI * frequency * (i/sampleRate));
    }

    function calculateMaskerAtIndex(i, sampleRate, frequency, maskerLevel) {
        var peakCalibrationValue = 0.01;
        var Lcalib = 60;
        var amplitude = peakCalibrationValue * Math.pow(10, (maskerLevel-Lcalib)/20);
        return amplitude * Math.random();
    }

    function applyRamp(bufferArray, rampSize) {
        var endIndex = bufferArray.length - 1;
        for (var i = 1; i <= rampSize; i++) {
            var rampValue = (1 - Math.cos((i/rampSize) * Math.PI))/2;
            bufferArray[i] = bufferArray[i] * rampValue;
            bufferArray[endIndex] = bufferArray[endIndex--] * rampValue;
        }
    }

}
