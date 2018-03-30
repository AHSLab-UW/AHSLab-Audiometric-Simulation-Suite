'use-strict';


angular
    .module('hearingTestApp.maskerMarks')
    .factory('maskerMarks', maskerMarks);


function maskerMarks(maskAxis, configConstants) {
    var masks = {};
    var maskList = [];

    masks.getMasks = getMasks;
    masks.pushResultMask = pushResultMask;
    //masks.clearMasks = clearMasks;

    return masks;

    function getMasks() {
        console.log(maskList);
        return maskList;
    }

    function pushResultMask(frequency, row , value) {
        if(frequency === 125 || frequency === 12000) {
          return
        }
        var top, left, width, value;


        // Push the new mark
        console.log(maskAxis.top[row]);
        maskList.push({
          top  : maskAxis.top[row],
          left : maskAxis.left[frequency],
          value: value,
          width: maskAxis.width[frequency],
        });
    }

    // // ClearMarks clears the canvas objects, lines drawn, and symbols
    // function clearMasks() {
    //     maskList.length = 0;
    //     ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    //     ctx.beginPath();
    //     ctx.closePath();
    // }

}

