'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:simulatedListener
 * @description
 * # simulatedListener
 */
angular.module('hearingTestApp.simulatedListener')
  .factory('simulatedListener', simulatedListener);

function simulatedListener() {
    var patientData = false;

    var listener = {};
    listener.getResponse = getResponse;
    listener.levelForPatient = levelForPatient;
    listener.setPatientData = setPatientData;
    listener.getPatientData = getPatientData;
    return listener;

    function getResponse(level, frequency, ear, conduction) {
        var beta = 1;
        var patientLevel = levelForPatient(frequency, ear, conduction);
        if (patientLevel !== false) {
            var probabilityYes = 1 / (1 + Math.pow(Math.E, (-beta * (level - patientLevel))));
            var randNum = Math.random();
            return (randNum < probabilityYes);
        } else {
            var randNum = Math.random();
            return (randNum < 0.5);
        }
    }

    function levelForPatient(frequency, ear, conduction) {
        if (patientData !== false) {
            for (var i = 0; i < patientData.length; i++) {
                var m = patientData[i];
                if (m.frequency === frequency && m.ear === ear && m.conduction === conduction) {
                    return m.stimulus;
                }
            }
        }
        return false;
    }

    function setPatientData(data) {
        patientData = data;
    }

    function getPatientData() {
        return patientData;
    }

}
