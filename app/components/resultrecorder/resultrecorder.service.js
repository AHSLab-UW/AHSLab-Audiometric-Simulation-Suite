'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:resultrecorder
 * @description
 * # resultrecorder
 */
angular.module('hearingTestApp.resultRecorder')
  .factory('resultRecorder', resultRecorder);

function resultRecorder(graphMarks) {
    var results = [];
    var recorder = {};

    recorder.addResult = addResult;
    recorder.getResults = getResults;

    return recorder;

    /**
     * Adds a result to the results array, given a frequency and stimulus
     */
    function addResult(frequency, stimulus, ear) {
        results.push({frequency: frequency, stimulus: stimulus, ear: ear});
        graphMarks.pushMark(frequency, stimulus, ear);
    }

    /**
     * Getter for results array
     */
    function getResults() {
        return results;
    }
}
