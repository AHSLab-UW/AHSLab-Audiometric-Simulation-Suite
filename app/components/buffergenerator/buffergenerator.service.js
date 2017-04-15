'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:bufferGenerator
 * @description
 * # bufferGenerator
 */
angular.module('hearingTestApp.bufferGenerator')
    .factory('bufferGenerator', bufferGenerator);

function bufferGenerator(webAudioContextFactory, configConstants, mathjsInstanceFactory, fastFourierTransform) {
    var audioContext = webAudioContextFactory.getInstance();
    var mathjs = mathjsInstanceFactory.getInstance();
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

        var noise = createNoise(bufferLength, frequency, sampleRate, maskerLevel);
        var maskerBuffering = audioBuffer.getChannelData(otherSide);
        for (var i = 0; i < bufferLength; i++) {
            maskerBuffering[i] = noise[i];
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

    function createNoise(bufferSize, signalFrequency, sampleRate, maskerLevel) {
        var peakCalibrationValue = 0.01,
            Lcalib = 60,
            real = [0],
            imag = [0],
            powerOfTwoLength = roundUpToPowerOfTwo(bufferSize),
            duration = powerOfTwoLength / sampleRate,
            lowerFrequency = signalFrequency - 50,
            upperFrequency = signalFrequency + 50;

        var j;
        for (var i = 1; i <= powerOfTwoLength/2; i++) {
            j = powerOfTwoLength - i;
            if (i < lowerFrequency || i > upperFrequency) {
                real[i] = 0;
                imag[i] = 0;
                real[j] = 0;
                imag[j] = 0;
            } else {
                var a = Math.randomGaussian(0,1).toString();
                var b = Math.randomGaussian(0,1).toString();
                var result = mathjs.eval('sqrt('+a+'^2 + '+b+'^2) * E^(i * (random() * (2 * PI)))');
                real[i] = result.re;
                imag[i] = result.im;
                real[j] = result.re;
                imag[j] = -result.im;
            }
        }
        var inverse = inverseFastFourierTransform(real, imag, bufferSize, sampleRate);
        var sigma = peakCalibrationValue * Math.pow(10, (maskerLevel - Lcalib)/20);
        return applyRootMeanSquare(inverse, sigma);
    }

    function inverseFastFourierTransform(real, imag, bufferSize, sampleRate) {
        var powerOfTwo = roundUpToPowerOfTwo(bufferSize);
        var fft = fastFourierTransform.getInstance(powerOfTwo, sampleRate);
        return fft.inverse(real, imag);
    }

    function applyRootMeanSquare(samples, sigma) {
        var square = mapArray(samples, function(x) { return x * x; }),
            sum = square.reduce(function(prev, curr) { return prev + curr; } ),
            avg = sum / samples.length,
            rms = Math.sqrt(avg);

        return mapArray(samples, function(x) { return x / rms * sigma; });
    }

    function mapArray(array, callback) {
        if (typeof(array.map) !== "undefined") {
            return array.map(callback);
        } else {
            var result = [];
            for(var i = 0; i < array.length; i++) {
                result[i] = callback(array[i]);
            }
            return result;
        }
    }

    function roundUpToPowerOfTwo(num) {
        return Math.pow(2, Math.ceil(Math.log(num) / Math.log(2)));
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
