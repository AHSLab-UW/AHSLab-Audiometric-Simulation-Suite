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
    graph.pushResultMark = pushResultMark;
    graph.pushCursorMark = pushCursorMark;
    graph.popMark = popMark;
    graph.clearMarks = clearMarks;

    return graph;

    function getMarks() {
        return markList;
    }

    function pushResultMark(frequency, stimulus, ear) {
        var top = graphAxis.yAxis[stimulus];
        var left = graphAxis.xAxis[frequency];
        var mark = ear === LEFT_EAR ? marks.AC_UNMASKED_LEFT : marks.AC_UNMASKED_RIGHT;
        var newMark = { path : mark,
                        top  : top,
                        left : left,
                        frequency: frequency,
                        stimulus: stimulus,
                        ear: ear
                      };
        // update mark if at the same frequency/ear combination
        for(var i = 0; i < markList.length; i++) {
            if (markList[i].frequency === newMark.frequency
                && markList[i].ear === newMark.ear) {
                markList[i].stimulus = newMark.stimulus;
                markList[i].top = newMark.top;
                return;
            }
        }
        markList.push(newMark);
    }

    function pushCursorMark(frequency, stimulus) {
        var top = graphAxis.yAxis[stimulus];
        var left = graphAxis.xAxis[frequency];
        var mark = marks.CURSOR;
        var newMark = { path : mark,
                        top  : top,
                        left : left
                      };
        markList.push(newMark);
    }

    function popMark() {
        return markList.pop();
    }

    function clearMarks() {
        markList.length = 0;
    }

}
