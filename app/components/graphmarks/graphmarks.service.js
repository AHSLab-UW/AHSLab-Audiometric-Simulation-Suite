'use-strict';


angular
    .module('hearingTestApp.graphMarks')
    .factory('graphMarks', graphMarks);


function graphMarks(graphAxis, marks) {
    var markList = [];
    var LEFT_EAR = 0,
        RIGHT_EAR = 1;

    var graph = {};

    graph.getMarks = getMarks;
    graph.pushMark = pushMark;
    graph.popMark = popMark;

    return graph;


    /*
     * Returns the list of marks.
     */
    function getMarks() {
        return markList;
    }

    /*
     * Validates the input and pushs it to the list.
     */
    function pushMark(frequency, stimulus, ear) {
        var top = graphAxis.yAxis[stimulus];
        var left = graphAxis.xAxis[frequency];
        var mark = ear === LEFT_EAR ? marks.AC_UNMASKED_LEFT : marks.AC_UNMASKED_RIGHT;
        var newMark = { path : mark,
                        top  : top,
                        left : left
                      };
        markList.push(newMark);
    }

    /*
     * Pops the last item that was inserted in the stack.
     */
    function popMark() {
        return markList.pop();
    }

}
