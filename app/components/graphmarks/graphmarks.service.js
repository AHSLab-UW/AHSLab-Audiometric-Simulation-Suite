'use-strict';


angular
    .module('hearingTestApp.graphMarks')
    .factory('graphMarks', graphMarks);


function graphMarks(graphAxis, marks, controlPanel, configConstants, maskerMarks) {
    var markList = [];
    // MarkJ (Mark JSON) stores the mark list and mark locations in a JSON Object
    var markJ = [{
        "lm": [{}],
        "lu": [{}],
        "rm": [{}],
        "ru": [{}]
    }];
    var graph = {};
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var prvX = null;
    var prvY = null;
    // Black = '#000000'
    // Red = '#C1272D'
    // Blue = '#0000FF'
    var black = '#000000';
    var red = '#C1272D';
    var blue = '#0000FF';

    graph.getMarks = getMarks;
    graph.pushResultMark = pushResultMark;
    graph.pushCursorMark = pushCursorMark;
    graph.popMark = popMark;
    graph.clearMarks = clearMarks;

    return graph;

    function getMarks() {
        return markList;
    }

    function getXY(ax,ay,bx,by) {
      var angleRad = Math.atan((ay-by)/(ax-bx));
      var angleDeg = angleRad * 180 / Math.PI;
      return angleRad;
    }

    function pushResultMark(frequency, stimulus, ear, conduction, masking, response) {
        if(frequency === 125 || frequency === 12000) {
          return
        }
        var top, left, mark, newConduction, width, height;
        top = graphAxis.yAxis[stimulus];
        left = graphAxis.xAxis[frequency];
        var markType = false;
        // The following is the nested if-else code for determining ear, masker, response, and conduction type
        if (conduction === configConstants.AC || conduction === undefined) {
          newConduction = configConstants.AC;
          width = 15;
          height = 15;
          if (ear === configConstants.LEFT_EAR) {
            if (masking === configConstants.MASKING){
              markType = 'lm';
                if (response === configConstants.RESPONSE){
                  mark = marks.AC_MASKED_LEFT;
                } else {
                  mark = marks.AC_MASKED_LEFT_NO;

                  width = 20;
                  height = 20;
                }
            } else {
              markType = 'lu';
              if (response === configConstants.RESPONSE){
                mark = marks.AC_UNMASKED_LEFT;

              } else {
                mark = marks.AC_UNMASKED_LEFT_NO;
                width = 20;
                height = 20;
              }
            }
            left = (parseInt(graphAxis.xAxis[frequency].split('p')[0]) +1 ) + 'px';
          } else {
            if (masking === configConstants.MASKING){
              markType = 'rm';
              if (response === configConstants.RESPONSE) {
                mark = marks.AC_MASKED_RIGHT;
              } else {
                mark = marks.AC_MASKED_RIGHT_NO;
                width = 20;
                height = 20;
                left = (parseInt(graphAxis.xAxis[frequency].split('p')[0]) -4 ) + 'px';
              }
            } else{
              markType = 'ru';
              if (response === configConstants.RESPONSE) {
                mark = marks.AC_UNMASKED_RIGHT;
              } else {
                mark = marks.AC_UNMASKED_RIGHT_NO;
                width = 20;
                height = 20;
                left = (parseInt(graphAxis.xAxis[frequency].split('p')[0]) -4) + 'px';
              }
            }
          }
        } else if(conduction === configConstants.BC) {
            newConduction = configConstants.BC;
            width = 15;
            height = 15;
            if (ear === configConstants.LEFT_EAR) {
                if (masking === configConstants.MASKING){
                  if (response === configConstants.RESPONSE){
                    left = graphAxis.xAxisLeftBC[frequency];
                    mark = marks.BC_MASKED_LEFT;
                  } else {
                    left = graphAxis.xAxisLeftBC[frequency];
                    mark = marks.BC_MASKED_LEFT_NO;
                    width = 20;
                    height = 20;
                  }
                } else {
                  if (response === configConstants.RESPONSE) {
                    left = (parseInt(graphAxis.xAxisRightBC[frequency].split('p')[0]) + 2.5) + 'px';
                    mark = marks.BC_UNMASKED_LEFT;
                    width = 25;
                    height = 12;
                    ear = configConstants.RIGHT_EAR;
                  } else {
                    left = (parseInt(graphAxis.xAxisRightBC[frequency].split('p')[0])+2.5) + 'px';
                    mark = marks.BC_UNMASKED_LEFT_NO;
                    ear = configConstants.RIGHT_EAR;
                    width = 27;
                    height = 20;
                  }
                }
            } else {
                if (masking === configConstants.MASKING) {
                  if (response === configConstants.RESPONSE) {
                    mark = marks.BC_MASKED_RIGHT;
                    left = graphAxis.xAxisRightBC[frequency];
                  } else {
                    mark = marks.BC_MASKED_RIGHT_NO;
                    left = (parseInt(graphAxis.xAxisRightBC[frequency].split('p')[0]) - 6.5) + 'px';
                    width = 20;
                    height = 20;
                  }
                } else {
                  if (response === configConstants.RESPONSE) {
                    left = (parseInt(graphAxis.xAxisRightBC[frequency].split('p')[0]) + 2.5) + 'px';
                    mark = marks.BC_UNMASKED_LEFT;
                    width = 25;
                    height = 12;
                  } else {
                    left = (parseInt(graphAxis.xAxisRightBC[frequency].split('p')[0])+2.5) + 'px';
                    mark = marks.BC_UNMASKED_LEFT_NO;
                    width = 27;
                    height = 20;
                  }
                }
            }
        }

        // The following takes location of symbols and passes it into the JSON, used for marking path
        var x =parseInt(left.split('p')[0]) + 8;
        var y =parseInt(top.split('p')[0]) + 8;

        // Structure our info
        if(markType){
          markJ[0][markType][0][frequency.toString()] = { 'frequency': frequency, 'stimulus': stimulus,
            'response': response, 'left':x,'top':y};
        }

        // Sorts the info so the line is drawn from lowest freq to highest
        for(var key in markJ[0]) {
          markJ[0][key].sort(function(a, b){
            return a.frequency - b.frequency;
          });
        };


        // Calls draw function with the marks JSON
        drawPath(markJ);

        // This is the data structure used for export on the mark list
        var newMark = { path : mark,
                        top  : top,
                        left : left,
                        frequency: frequency,
                        stimulus: stimulus,
                        ear: ear,
                        conduction: newConduction,
                        masked: masking,
                        response: response,
                        width: width,
                        height: height
                      };

        // if newMark has the same frequency and symbol as an older mark,
        // update the older mark to the new stimulus level
        for(var i = 0; i < markList.length; i++) {
            if (markList[i].frequency === newMark.frequency && markList[i].ear === newMark.ear
                && markList[i].conduction === newMark.conduction && markList[i].masked === newMark.masked) {
                markList[i] = newMark;
                return;
            }
        }

        // Push the new mark
        markList.push(newMark);
        if(response === configConstants.RESPONSE && masking === configConstants.MASKING){
          var row = conduction.toString()+'_'+ear.toString();
          console.log('row',row);
          maskerMarks.pushResultMask(frequency, row, controlPanel.getMaskerLevel());
        }


    }

    function pushCursorMark(frequency, stimulus) {
        var top = (parseInt(graphAxis.yAxis[stimulus].split('p')[0])) + 'px';
        var left = (parseInt(graphAxis.xAxis[frequency].split('p')[0])) + 'px';
        var mark = marks.CURSOR;
        var newMark = { path : mark,
                        top  : top,
                        left : left,
                        height: 15,
                        width: 15
                      };
        markList.push(newMark);
    }

    function popMark() {
        return markList.pop();
    }

    // ClearMarks clears the canvas objects, lines drawn, and symbols
    function clearMarks() {
        markList.length = 0;
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        ctx.beginPath();
        ctx.closePath();
        markJ = [{
          "lm": [{}],
          "lu": [{}],
          "rm": [{}],
          "ru": [{}]
        }];
    }

    // Draw path takes a JSON mark list and computes the line between elements, draws the line and handles color
    function drawPath(marks){
      // Offset used for where the line meets the symbol
      var offset = 15;
      // Clears Rect in-between drawings of the lines, clears out the old lines
      ctx.clearRect(0,0,700,700);
      // Initializing the stroke value
      var color = black;

      // This code iterate through the JSON data structure
      for(var key in marks[0]){
        ctx.beginPath();
        color = key[0] === 'l' ? blue : red;
        ctx.strokeStyle = color;
        ctx.lineWidth=4;
        var prvX = null;
        var prvY = null;
        for(var mark in marks[0][key][0]) {
          var x = marks[0][key][0][mark].left;
          var y = marks[0][key][0][mark].top;
          var response = marks[0][key][0][mark].response;
          if (prvX !== null) {
            var angleDeg = getXY(x, y, prvX, prvY);
            var aX, bX, aY, bY = 0;
            if (prvY < y) {
              aX = prvX + Math.cos(angleDeg) * offset;
              aY = prvY + Math.sin(angleDeg) * offset;

              bX = x - Math.cos(angleDeg) * offset;
              bY = y - Math.sin(angleDeg) * offset;
            } else {
              aX = x - Math.cos(angleDeg) * offset;
              aY = y - Math.sin(angleDeg) * offset;

              bX = prvX + Math.cos(angleDeg) * offset;
              bY = prvY + Math.sin(angleDeg) * offset;
            }
            ctx.moveTo(aX, aY);
            if(response) {
              ctx.lineTo(bX, bY);
            }

          }
          if (response) {
            prvX = x;
            prvY = y;
          } else {
            prvX = null;
            prvY = null;
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

}

