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
    var option = {};
    var side = RIGHT_EAR;
    var frequency = 250;
    var stimulus = 50;
    var panel = {};

    panel.resetState = resetState;
    panel.setOption = setOption;
    panel.getOption = getOption;
    panel.setSide = setSide;
    panel.getSide = getSide;
    panel.setFrequency = setFrequency;
    panel.getFrequency = getFrequency;
    panel.setStimulus = setStimulus;
    panel.getStimulus = getStimulus;

    return panel;

    /**
     * Resets the state to it's current state.
     */
    function resetState() {
        option = {};
        side = RIGHT_EAR;
        frequency = 250;
        stimulus = 50;
        panel = {};
    }

    /**
     * Setter for options
     * @param {object} newOption - option chosen by the user
     */
    function setOption(newOption) {
        option = newOption;
    }

    /**
     * Getter for options
     * @return {object} - saved options
     */
    function getOption(newOption) {
        return option;
    }

    /**
     * Setter for side
     * @param {number} newSide - 0 for left ear and 1 for right ear
     */
    function setSide(newSide) {
        side = newSide;
    }

    /**
     * Getter for side
     * @return {number} - 0 for left ear and 1 for right ear
     */
    function getSide() {
        return side;
    }

    /**
     * Setter for frequency
     * @param {number} newFrequency - frequency to store
     */
    function setFrequency(newFrequency) {
        frequency = newFrequency;
    }

    /**
     * Getter for frequency
     * @return {number} - stored frequency
     */
    function getFrequency() {
        return frequency;
    }

    /**
     * Setter for stimulus
     * @param {number} newStimulus - stimulus to store
     */
    function setStimulus(newStimulus) {
        stimulus = newStimulus;
    }

    /**
     * Getter for stimulus
     * @return {number} - stored stimulus
     */
    function getStimulus() {
        return stimulus;
    }
}
