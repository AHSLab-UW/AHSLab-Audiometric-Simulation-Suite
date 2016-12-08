'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:resultrecorder
 * @description
 * # resultrecorder
 */
angular.module('hearingTestApp.resultRecorder')
  .factory('resultRecorder', resultRecorder);

function resultRecorder(graphMarks, graphAxis, marks) {
    var results = [];
    var LEFT_EAR = 0,
        RIGHT_EAR = 1;
    var recorder = {};

    recorder.addResult = addResult;
    recorder.getResults = getResults;

    return recorder;

    /**
     * Adds a result to the results array, given a frequency and stimulus
     */
    function addResult(frequency, stimulus, ear) {
        results.push({frequency: frequency, stimulus: stimulus, ear: ear});
        // call to update graph
        var top = graphAxis.yAxis[stimulus];
        var left = graphAxis.xAxis[frequency];
        var mark = ear === LEFT_EAR ? marks.AC_UNMASKED_LEFT : marks.AC_UNMASKED_RIGHT;
        graphMarks.pushMark(mark, top, left);
    }

    /**
     * Getter for results array
     */
    function getResults() {
        return results;
    }
}
