'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:controlpanel
 * @description
 * # controlpanel
 */
angular.module('hearingTestApp.controlPanel')
  .factory('controlPanel', controlPanel);

function controlPanel(configConstants) {
    var side = configConstants.RIGHT_EAR;
    var conduction = configConstants.AC;
    var frequency = 250;
    var stimulus = 50;
    var panel = {};

    panel.resetState = resetState;
    panel.setConduction = setConduction;
    panel.getConduction = getConduction;
    panel.setSide = setSide;
    panel.getSide = getSide;
    panel.setFrequency = setFrequency;
    panel.getFrequency = getFrequency;
    panel.setStimulus = setStimulus;
    panel.getStimulus = getStimulus;

    return panel;

    function resetState() {
        side = configConstants.RIGHT_EAR;
        frequency = 250;
        stimulus = 50;
    }

    function setConduction(newConduction) {
        conduction = newConduction;
    }

    function getConduction() {
        return conduction;
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
