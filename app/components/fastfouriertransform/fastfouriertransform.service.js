(function () {

    'use strict';

    angular
        .module('fastFourierTransform')
        .factory('fastFourierTransform', fastFourierTransform);

    function fastFourierTransform() {
        var fft = {};
        fft.getInstance = getInstance;
        return fft;

        function getInstance(bufferSize, sampleRate) {
            return new FFT(bufferSize, sampleRate);
        }
    };

}());
