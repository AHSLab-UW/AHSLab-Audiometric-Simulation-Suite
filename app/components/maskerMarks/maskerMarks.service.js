'use-strict';


angular
    .module('hearingTestApp.maskerMarks')
    .factory('maskerMarks', maskerMarks);


function maskerMarks(maskAxis, configConstants) {
    var masks = {};
    var maskList = [];

    masks.getMasks = getMasks;
    masks.pushResultMask = pushResultMask;
    masks.clearMasks = clearMasks;

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
        //top = maskAxis.yAxis[stimulus];
        //left = maskAxis.xAxis[frequency];
        var markType = false;
        // The following is the nested if-else code for determining ear, masker, response, and conduction type
        // if (conduction === configConstants.AC || conduction === undefined) {
        //   newConduction = configConstants.AC;
        //   width = 15;
        //   height = 15;
        //   if (ear === configConstants.LEFT_EAR) {
        //     if (masking === configConstants.MASKING){
        //       markType = 'lm';
        //         if (response === configConstants.RESPONSE){
        //           mark = marks.AC_MASKED_LEFT;
        //         } else {
        //           mark = marks.AC_MASKED_LEFT_NO;
        //
        //           width = 20;
        //           height = 20;
        //         }
        //     } else {
        //       markType = 'lu';
        //       if (response === configConstants.RESPONSE){
        //         mark = marks.AC_UNMASKED_LEFT;
        //
        //       } else {
        //         mark = marks.AC_UNMASKED_LEFT_NO;
        //         width = 20;
        //         height = 20;
        //       }
        //     }
        //     left = (parseInt(maskAxis.xAxis[frequency].split('p')[0]) +1 ) + 'px';
        //   } else {
        //     if (masking === configConstants.MASKING){
        //       markType = 'rm';
        //       if (response === configConstants.RESPONSE) {
        //         mark = marks.AC_MASKED_RIGHT;
        //       } else {
        //         mark = marks.AC_MASKED_RIGHT_NO;
        //         width = 20;
        //         height = 20;
        //         left = (parseInt(maskAxis.xAxis[frequency].split('p')[0]) -4 ) + 'px';
        //       }
        //     } else{
        //       markType = 'ru';
        //       if (response === configConstants.RESPONSE) {
        //         mark = marks.AC_UNMASKED_RIGHT;
        //       } else {
        //         mark = marks.AC_UNMASKED_RIGHT_NO;
        //         width = 20;
        //         height = 20;
        //         left = (parseInt(maskAxis.xAxis[frequency].split('p')[0]) -4) + 'px';
        //       }
        //     }
        //   }
        // } else if(conduction === configConstants.BC) {
        //     newConduction = configConstants.BC;
        //     width = 15;
        //     height = 15;
        //     if (ear === configConstants.LEFT_EAR) {
        //         if (masking === configConstants.MASKING){
        //           if (response === configConstants.RESPONSE){
        //             left = maskAxis.xAxisLeftBC[frequency];
        //             mark = marks.BC_MASKED_LEFT;
        //           } else {
        //             left = maskAxis.xAxisLeftBC[frequency];
        //             mark = marks.BC_MASKED_LEFT_NO;
        //             width = 20;
        //             height = 20;
        //           }
        //         } else {
        //           if (response === configConstants.RESPONSE) {
        //             left = (parseInt(maskAxis.xAxisRightBC[frequency].split('p')[0]) + 2.5) + 'px';
        //             mark = marks.BC_UNMASKED_LEFT;
        //             width = 25;
        //             height = 12;
        //             ear = configConstants.RIGHT_EAR;
        //           } else {
        //             left = (parseInt(maskAxis.xAxisRightBC[frequency].split('p')[0])+2.5) + 'px';
        //             mark = marks.BC_UNMASKED_LEFT_NO;
        //             ear = configConstants.RIGHT_EAR;
        //             width = 27;
        //             height = 20;
        //           }
        //         }
        //     } else {
        //         if (masking === configConstants.MASKING) {
        //           if (response === configConstants.RESPONSE) {
        //             mark = marks.BC_MASKED_RIGHT;
        //             left = maskAxis.xAxisRightBC[frequency];
        //           } else {
        //             mark = marks.BC_MASKED_RIGHT_NO;
        //             left = (parseInt(maskAxis.xAxisRightBC[frequency].split('p')[0]) - 6.5) + 'px';
        //             width = 20;
        //             height = 20;
        //           }
        //         } else {
        //           if (response === configConstants.RESPONSE) {
        //             left = (parseInt(maskAxis.xAxisRightBC[frequency].split('p')[0]) + 2.5) + 'px';
        //             mark = marks.BC_UNMASKED_LEFT;
        //             width = 25;
        //             height = 12;
        //           } else {
        //             left = (parseInt(maskAxis.xAxisRightBC[frequency].split('p')[0])+2.5) + 'px';
        //             mark = marks.BC_UNMASKED_LEFT_NO;
        //             width = 27;
        //             height = 20;
        //           }
        //         }
        //     }
        // }

        // The following takes location of symbols and passes it into the JSON, used for marking path
        //var x =parseInt(left.split('p')[0]) + 8;
        //var y =parseInt(top.split('p')[0]) + 8;

        // Structure our info
        // if(markType){
        //   markJ[0][markType][0][frequency.toString()] = { 'frequency': frequency, 'stimulus': stimulus,
        //     'response': response, 'left':x,'top':y};
        // }

        // Sorts the info so the line is drawn from lowest freq to highest
        // for(var key in markJ[0]) {
        //   markJ[0][key].sort(function(a, b){
        //     return a.frequency - b.frequency;
        //   });
        // };


        // Calls draw function with the marks JSON
        //drawPath(markJ);

        // This is the data structure used for export on the mark list
        var newMark = {
          //path : mark
          };
        //                 top  : top,
        //                 left : left,
        //                 frequency: frequency,
        //                 stimulus: stimulus,
        //                 ear: ear,
        //                 conduction: newConduction,
        //                 masked: masking,
        //                 response: response,
        //                 width: width,
        //                 height: height
        //               };

        // if newMark has the same frequency and symbol as an older mark,
        // update the older mark to the new stimulus level
        // for(var i = 0; i < maskList.length; i++) {
        //     if (maskList[i].frequency === newMark.frequency && maskList[i].ear === newMark.ear
        //         && maskList[i].conduction === newMark.conduction && maskList[i].masked === newMark.masked) {
        //         maskList[i] = newMark;
        //         return;
        //     }
        // }

        // Push the new mark
        console.log(maskAxis.top[row]);
        maskList.push({
          top  : maskAxis.top[row],
          left : maskAxis.left[frequency],
          value: value,
          width: maskAxis.width[frequency],
        });
    }

    function pushCursorMark(frequency, stimulus) {
        var top = (parseInt(maskAxis.yAxis[stimulus].split('p')[0])) + 'px';
        var left = (parseInt(maskAxis.xAxis[frequency].split('p')[0])) + 'px';
        var mark = marks.CURSOR;
        var newMark = { path : mark,
                        top  : top,
                        left : left,
                        height: 15,
                        width: 15
                      };
        maskList.push(newMark);
    }

    function popMark() {
        return maskList.pop();
    }

    // ClearMarks clears the canvas objects, lines drawn, and symbols
    function clearMasks() {
        maskList.length = 0;
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        ctx.beginPath();
        ctx.closePath();
    }

}

