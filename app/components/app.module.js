'use strict';

/**
 * @ngdoc overview
 * @name hearingTestApp
 * @description
 * # hearingTestApp
 *
 * Main module of the application.
 */
angular
    .module('hearingTestApp', [
        'ngAnimate',
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'ui.bootstrap',
        'webAudio',
        'hearingTestApp.main',
        'hearingTestApp.calibration',
        'hearingTestApp.controlPanel',
        'hearingTestApp.automaticExercise',
        'hearingTestApp.resultRecorder',
        'hearingTestApp.graphMarks',
        'hearingTestApp.bufferGenerator',
        'hearingTestApp.audioPlayer'
    ]);
