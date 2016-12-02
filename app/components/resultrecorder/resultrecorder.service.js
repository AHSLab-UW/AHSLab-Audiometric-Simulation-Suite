'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:resultrecorder
 * @description
 * # resultrecorder
 */
angular.module('hearingTestApp.resultRecorder')
  .factory('resultRecorder', resultRecorder);

function resultRecorder(graphMarks, marks) {
    var results = [];
    var recorder = {};

    recorder.addResult = addResult;
    recorder.getResults = getResults;

    return recorder;

    /**
     * Adds a result to the results array, given a frequency and stimulus
     */
    function addResult(frequency, stimulus) {
        results.push({frequency: frequency, stimulus: stimulus});
        // call to update graph
        var top = marks.yAxis[stimulus];
        var left = marks.xAxis[frequency];
        graphMarks.pushMark(marks.AC_UNMASKED_LEFT, top, left);
    }

    /**
     * Getter for results array
     */
    function getResults() {
        return results;
    }
}
