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
            xAxis: {
                '125': (105) + 'px',
                '250': (180) + 'px',
                '500': (254) + 'px',
                '750': (294) + 'px',
                '1000': (328) + 'px',
                '1500': (367) + 'px',
                '2000': (401) + 'px',
                '3000': (443) + 'px',
                '4000': (477) + 'px',
                '6000': (518) + 'px',
                '8000': (551) + 'px',
                '12000': (594) + 'px'
            },
            yAxis: {
                '-10': (88) + 'px',
                '0': (88 + 31) + 'px',
                '10': (88 + (31 * 2)) + 'px',
                '20': (88 + (31 * 3)) + 'px',
                '30': (88 + (31 * 4)) + 'px',
                '40': (88 + (31 * 5)) + 'px',
                '50': (88 + (31 * 6)) + 'px',
                '60': (88 + (31 * 7)) + 'px',
                '70': (88 + (31 * 8)) + 'px',
                '80': (88 + (31 * 9)) + 'px',
                '90': (88 + (31 * 10)) + 'px',
                '100': (88 + (31 * 11)) + 'px',
                '110': (88 + (31 * 12)) + 'px',
                '120': (88 + (31 * 13)) + 'px'
            }
        });


}());
