'use-strict';


angular
    .module('hearingTestApp.graphMarks')
    .directive('graphMarks', graphMarks);


function graphMarks(graphMarks) {
    return {
        templateUrl: 'components/graphmarks/graphmarks.html',
        scope: {},
        restrict: 'E',
        replace: false,
        controller: 'GraphMarksCtrl',
        controllerAs: 'vm',
        bindToController: true,
        link: postLink
    };

    function postLink(scope, element, atttribute, ctrl) {
        var upperBound = 93;
        var leftBound = 110;
        ctrl.marks = graphMarks.getMarks();
    }

}
