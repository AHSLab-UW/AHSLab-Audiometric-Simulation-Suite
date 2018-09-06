(function () {

    'use-strict';

    angular
        .module('hearingTestApp.main')
        .constant('configConstants', {
            LEFT_EAR: 0,
            RIGHT_EAR: 1,
            AC: 0,
            BC: 1,
            MASKING: 1,
            NO_MASKING: 0,
            RESPONSE: 1,
            NO_RESPONSE: 0,
            BC_WARNING_AUTO: 'Bone Conduction tests are not available.',
            BC_WARNING_MANUAL: 'No sound will be presented during Bone Conduction test. However, you may mark the BC thresholds on the audiogram.',
            NO_BC_DATA: 'The imported data has one or more missing values for the BC thresholds levels at this Frequency.'

        });

}());
