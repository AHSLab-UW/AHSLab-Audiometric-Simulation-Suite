(function () {

    'use strict';

    /**
     * @ngdoc directive
     * @name hearingTestApp.directive:automaticexercise
     * @description
     * # automaticexercise
     */
    angular.module('hearingTestApp.automaticExercise')
        .directive('automaticExercise', automaticExercise);

    /** @ngInject */
    function automaticExercise() {
        return {
            templateUrl: 'components/automaticexercise/automaticexercise.html',
            scope: { isAutoTesting: '=' },
            restrict: 'E',
            controller: 'AutomaticExerciseCtrl',
            controllerAs: 'vm',
            bindToController: true
        };
    }

}());
