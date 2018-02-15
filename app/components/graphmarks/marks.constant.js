(function () {

    'use-strict';


    angular
        .module('hearingTestApp.graphMarks')
        .constant('marks', {
            AC_UNMASKED_RIGHT: 'images/o.png',
            AC_UNMASKED_LEFT: 'images/x.png',
            AC_MASKED_RIGHT: 'images/triangle.png',
            AC_MASKED_LEFT: 'images/square.png',
            AC_UNMASKED_RIGHT_NO: 'images/o-no-response.png',
            AC_UNMASKED_LEFT_NO: 'images/x-no-response.png',
            AC_MASKED_RIGHT_NO: 'images/triangle-no-response.png',
            AC_MASKED_LEFT_NO: 'images/square-no-response.png',
            // BC_UNMASKED_RIGHT: 'images/less-than.png',       - removed and replaced --\____ Replaced with wedge
            // BC_UNMASKED_LEFT: 'images/greater-than.png',     - removed and replaced --/
            BC_UNMASKED_RIGHT: 'images/wedge.png',
            BC_UNMASKED_LEFT: 'images/wedge.png',
            BC_UNMASKED_LEFT_NO: 'images/wedge-no-response-alt-2.png',
            BC_MASKED_RIGHT: 'images/open-square-bracket.png',
            BC_MASKED_LEFT: 'images/close-square-bracket.png',
            //NO_RESPONSE_RIGHT: 'images/lower-left-arrow.png', - removed and replaced --\____ Replaced with wedge-no
            //NO_RESPONSE_LEFT: 'images/lower-right-arrow.png', - removed and replaced --/
            BC_MASKED_RIGHT_NO: 'images/open-square-bracket-no-response.png',
            BC_MASKED_LEFT_NO: 'images/close-square-bracket-no-response.png',
            CURSOR: 'images/cursor.png'
        });


}());
