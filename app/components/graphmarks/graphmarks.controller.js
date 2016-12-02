'use-strict';


angular
    .module('hearingTestApp.graphMarks')
    .controller('GraphMarksCtrl', GraphMarksCtrl);


function GraphMarksCtrl($interval, graphMarks, marks) {
    var vm = this;

    // var xAxis = marks.xAxis;
    // var xKeys = Object.keys(xAxis);
    // var top = marks.yAxis['10'];
    // var left = marks.xAxis['125'];
    // var i = 0;
    // var j = 0;
    // $interval(function() {
    //     graphMarks.popMark();
    //     left = xAxis[xKeys[i]];
    //     i += 1;
    //     test(top, left);
    // }, 500, xKeys.length);

    // function test(top, left) {
    //     graphMarks.pushMark(marks.AC_UNMASKED_LEFT, top, left);
    // }
}

