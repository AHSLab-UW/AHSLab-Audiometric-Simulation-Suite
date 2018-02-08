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
    var masking = configConstants.NO_MASKING;
    var response = configConstants.RESPONSE;
    var frequency = 250;
    var stimulus = 50;
    var maskerLevel = 40;
    var panel = {};

    panel.resetState = resetState;
    panel.setConduction = setConduction;
    panel.getConduction = getConduction;
    panel.setSide = setSide;
    panel.getSide = getSide;
    panel.setMasking = setMasking;
    panel.getMasking = getMasking;
    panel.setResponse = setResponse;
    panel.getResponse = getResponse;
    panel.setFrequency = setFrequency;
    panel.getFrequency = getFrequency;
    panel.setStimulus = setStimulus;
    panel.getStimulus = getStimulus;
    panel.setMaskerLevel = setMaskerLevel;
    panel.getMaskerLevel = getMaskerLevel;

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

    function setMasking(newMasking) {
        masking = newMasking;
    }

    function getMasking() {
        return masking;
    }

    function setResponse(newResponse) {
      response = newResponse;
    }

    function getResponse() {
      return response;
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

    function setMaskerLevel(newMaskerLevel) {
        maskerLevel = newMaskerLevel;
    }

    function getMaskerLevel() {
        return maskerLevel;
    }
}
