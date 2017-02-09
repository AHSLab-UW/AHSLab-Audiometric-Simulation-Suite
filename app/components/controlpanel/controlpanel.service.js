'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:controlpanel
 * @description
 * # controlpanel
 */
angular.module('hearingTestApp.controlPanel')
  .factory('controlPanel', controlPanel);

function controlPanel() {
    var LEFT_EAR = 0;
    var RIGHT_EAR = 1;
    var side = RIGHT_EAR;
    var frequency = 250;
    var stimulus = 50;
    var panel = {};

    panel.resetState = resetState;
    panel.setSide = setSide;
    panel.getSide = getSide;
    panel.setFrequency = setFrequency;
    panel.getFrequency = getFrequency;
    panel.setStimulus = setStimulus;
    panel.getStimulus = getStimulus;

    return panel;

    function resetState() {
        side = RIGHT_EAR;
        frequency = 250;
        stimulus = 50;
    }

    function setSide(newSide) {
        side = newSide;
    }

    function getSide() {
        return side;
    }

    function setFrequency(newFrequency) {
        frequency = newFrequency;
    }

    function getFrequency() {
        return frequency;
    }

    function setStimulus(newStimulus) {
        stimulus = newStimulus;
    }

    function getStimulus() {
        return stimulus;
    }
}
