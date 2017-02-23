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
        'ngFileUpload',
        'ui.bootstrap',
        'webAudio',
        'domToImage',
        'cryptoLibrary',
        'hearingTestApp.main',
        'hearingTestApp.calibration',
        'hearingTestApp.controlPanel',
        'hearingTestApp.automaticExercise',
        'hearingTestApp.graphMarks',
        'hearingTestApp.bufferGenerator',
        'hearingTestApp.audioPlayer',
        'hearingTestApp.import',
        'hearingTestApp.export',
        'hearingTestApp.fileProcessor'
    ]);
