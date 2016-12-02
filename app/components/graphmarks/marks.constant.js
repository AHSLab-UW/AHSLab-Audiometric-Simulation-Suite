(function () {

    'use-strict';


    angular
        .module('hearingTestApp.graphMarks')
        .constant('marks', {
            AC_UNMASKED_RIGHT: 'images/o.png',
            AC_UNMASKED_LEFT: 'images/x.png',
            AC_MASKED_RIGHT: 'images/triangle.png',
            AC_MASKED_LEFT: 'images/square.png',
            BC_UNMASKED_RIGHT: 'images/less-than.png',
            BC_UNMASKED_LEFT: 'images/greater-than.png',
            BC_MASKED_RIGHT: 'images/open-square-bracket.png',
            BC_MASKED_LEFT: 'images/close-square-bracket.png',
            NO_RESPONSE_RIGHT: 'images/lower-left-arrow.png',
            NO_RESPONSE_LEFT: 'images/lower-right-arrow.png',
            CURSOR: 'images/cursor.png'
        });


}());
