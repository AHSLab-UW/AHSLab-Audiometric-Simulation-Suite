'use strict';

/**
 * @ngdoc service
 * @name hearingTestApp.factory:simulatedListener
 * @description
 * # simulatedListener
 */
angular.module('hearingTestApp.simulatedListener')
  .factory('simulatedListener', simulatedListener);

function simulatedListener($window,configConstants) {
    var patientData = false;
    var listener = {};
    listener.getResponse = getResponse;
    listener.levelForPatient = levelForPatient;
    listener.setPatientData = setPatientData;
    listener.getPatientData = getPatientData;
    return listener;

    function getResponse(level, frequency, ear, conduction, masking) {
        var beta = 1;
        var patientLevel = levelForPatient(frequency, ear, conduction,level,masking);
        console.log('patient', patientLevel);
        console.log('masking', masking);
      var randNum;
        if (patientLevel !== false) {
            var probabilityYes = 1 / (1 + Math.pow(Math.E, (-beta * (level - patientLevel))));
            randNum = Math.random();
            return (randNum < probabilityYes);
        } else {
            randNum = Math.random();
            return (randNum < 0.5);
        }
    }

    function maskerPlateau(acTE,acNTE,bcTE,bcNTE,conduction,level,masked){
      var masker = document.getElementById('masker').innerHTML;
      var maskerVal = parseInt(masker.slice(0,masker.indexOf('d')));
      var abgNTE = acNTE - bcNTE;
      var abgTE = acTE - bcTE;
      var cf = 15;
      // var iaNTEtoTE = (acNTE - bcTE > 40) ? acNTE - bcTE : 40;
      // var iaTEtoNTE = (acTE - bcNTE > 40) ? acTE - bcNTE : 40;
      var ia = conduction === 1 ? 0 : 40;
      var centralMasking = masked ? 5 : 0;
      console.log('masking', masked);
      console.log('conduction', conduction);
      // #console.log('Cross hearing? Indicator 1 - ', (abgTE >= bcNTE));
      // console.log('Cross hearing? Indicator 2 - ', (acTE - bcNTE >= 40));
      console.log('AC_te:',acTE,'AC_nte',acNTE,'BC_te',bcTE,'BC_nte:',bcNTE);
      console.log('Cross over amount: ', (acTE - ia), 'BC_nte', bcNTE, 'AC_te', acTE);
      console.log('Cross test actual:', (acTE- ia) >= bcNTE);
      console.log('agb nte ', (abgNTE));
      var crossTest = (acTE- ia) >= bcNTE;
      //!!!!!! max > min > init
      var rl = 0;
      if(conduction === 0) {
        if (masked && crossTest) {
          var zeroMasker = 0;
          var initMasker = acNTE + cf;
          var minMasker = acNTE + (acTE - ia) + cf;
          var maxMasker = bcTE + ia + cf;
          console.log('!', zeroMasker, initMasker, minMasker, maxMasker);
          if (maskerVal >= zeroMasker && maskerVal < initMasker) {
            rl = bcNTE + ia + centralMasking;
            console.log('Masker in region 1:', rl);
            return rl;
          } else if (maskerVal >= initMasker && maskerVal < minMasker) {
            rl = (bcNTE + ia + (maskerVal - initMasker)) + centralMasking;
            console.log('Masker in region 2:', rl);
            return rl;
          } else if (maskerVal >= minMasker && maskerVal < maxMasker) {
            rl = acTE + centralMasking;
            console.log('Masker in region 3:', rl);
            return rl;
          } else if (maskerVal >= maxMasker) {
            rl = (acTE + (maskerVal - maxMasker)) + centralMasking;
            console.log('Masker in region 4:', rl);
            return rl;
          }
        } else if (crossTest) {
          console.log('Not masked cross hearing');
          return bcNTE + ia;
        } else if (masked) {
          if (maskerVal - ia - cf >= bcTE) {
            rl = (acTE + (maskerVal - ia - cf - bcTE)) + centralMasking;
            console.log('Over masking occurred: AC_te - ', acTE, 'RL - ', rl);
          } else {
            console.log('No over masking');
            rl = acTE + centralMasking;
          }
          return rl;
        } else {
          var responseLevel = acTE;
          console.log('No masked, no cross hearing, ac test:', responseLevel);
          return responseLevel;
        }
      } else if(conduction === 1) {
        var zeroMaskerBC = 0;
        var initMaskerBC = acNTE + cf + findOE(bcNTE);
        var minMaskerBC = acNTE + cf + (bcTE - bcNTE) + findOE(bcTE);
        var maxMaskerBC = bcTE + 40 + findOE(bcTE) + cf;
        var crossTestBC = bcTE >= bcNTE - findOE(bcTE);
        console.log('Cross test: ' + crossTestBC);
        console.log('!', zeroMaskerBC, initMaskerBC, minMaskerBC, maxMaskerBC);
        if (masked && crossTestBC) {
          if (maskerVal >= zeroMaskerBC && maskerVal < initMaskerBC) {
            rl = bcNTE + centralMasking;
            console.log('Masker in region 1:', rl);
            return rl;
          } else if (maskerVal >= initMaskerBC && maskerVal < minMaskerBC) {
            rl = bcNTE + (maskerVal - initMaskerBC) + centralMasking;
            console.log('Masker in region 2:', rl);
            return rl;
          } else if (maskerVal >= minMaskerBC && maskerVal < maxMaskerBC) {
            rl = bcTE + centralMasking;
            console.log('Masker in region 3:', rl);
            return rl;
          } else if (maskerVal >= maxMaskerBC) {
            rl = bcTE + (maskerVal - maxMaskerBC) + centralMasking;
            console.log('Masker in region 4:', rl);
            return rl;
          }
        } else if (crossTestBC) {
          console.log('Not masked cross hearing');
          return bcNTE + ia;
        } else if (masked) {
          if (maskerVal - 40 - cf >= bcTE) {
            rl = bcTE + (maskerVal - maxMaskerBC) + centralMasking;
            console.log('Over masking occurred: BC_te - ', bcTE, 'RL - ', rl);
          } else {
            console.log('No over masking');
            rl = bcTE + centralMasking;
          }
          return rl;
        } else {
          console.log('No masked, no cross hearing, bc test:', bcTE);
          return bcTE;
        }
      }
    }

    function findOE(level){
      var occlusionEffect = {'125':20,'250':20, '500':15,'750':10, '1000':5};
      var occlusionEffectLevel = 60;
      var fq = document.getElementById('frequency').innerHTML.split('H')[0].trim();
      var oe = occlusionEffect[fq] !== undefined ? occlusionEffect[fq] : 0;
      return Math.ceil(oe * (level/occlusionEffectLevel));
    }



    function levelForPatient(frequency, ear, conduction, level, masking) {
        /*The formula for determining likelihood of x-hearing is
          AC_test_ear - Internal Attenuation >= BC_non_test_ear
          For our purposes Internal Attenuation for AC = 40, BC = 0

          The formula for effective masking
          EM = AC_non_test_eat + Correction_Factor
          For our purposes Correction_Factor = 15 dB HL

          The formula for when to use masking (ABG - Air Bone Gap between AC and BC)
          ABG_test_eat > 10 db

          10/01/2017 - Testing with just AC

         AC: 0,
         BC: 1
         LEFT_EAR: 0,
         RIGHT_EAR: 1,
         */

        var NTE = Math.abs(ear - 1);
        var acTE = false;
        var bcTE = false;
        var acNTE = false;
        var bcNTE = false;
        var tempAcNTE = null;
        var tempAcTE = null;
        var tempBcBoth = null;
        var tempBcTE = null;
        var masked = masking;

        if (patientData !== false) {
          for (var i = 0; i < patientData.length; i++) {
            var m = patientData[i];
            if (m.frequency === frequency && m.ear === ear && m.conduction === 0 ) {
              if(m.masked === 1){
                acTE = m.stimulus;
              } else {
                tempAcTE = m.stimulus;
              }
              console.log('acTE', acTE, 'tempAcTE', tempAcTE);
              // Not sure what this is for?
            // } else if (m.frequency === frequency && m.ear === ear && m.conduction === 0 && m.masked === 0 && acTE === undefined) {
            //   acTE = m.stimulus
            } else if (m.frequency === frequency && m.ear === NTE && m.conduction === 0) {
              if(m.masked === 1){
                acNTE = m.stimulus;
              } else {
                tempAcNTE = m.stimulus;
              }
              console.log('acNTE', acNTE, 'tempAcNTE', tempAcNTE);
            } else if (m.frequency === frequency && m.ear === ear && m.conduction === 1) {
              if(m.masked === 1){
                bcTE = m.stimulus;
              } else {
                tempBcBoth = m.stimulus;
              }
              console.log('bcTE', bcTE, 'tempBcTE', tempBcBoth);
            } else if (m.frequency === frequency && m.ear === NTE && m.conduction === 1) {
              if(m.masked === 1){
                bcNTE = m.stimulus;
              } else {
                tempBcBoth = m.stimulus;
              }
              console.log('bcNTE', bcNTE, 'tempBcNTE', tempBcBoth);
            }
          }
        }
        // This assigns the bc of TE and NTE to either themselves or the unmasked value
        bcTE = (bcTE) ? bcTE : tempBcBoth;
        bcNTE = (bcNTE) ? bcNTE : tempBcBoth;

        if (bcTE === null || bcNTE === null){
          $window.alert(configConstants.NO_BC_DATA);
        }


        // This assigns the ac of TE and NTE to either themselves or the unmasked value using ternary op
        acTE = (acTE) ? acTE : tempAcTE;
        acNTE = (acNTE) ? acNTE : tempAcNTE;

        var avg = 0;
        //
      // If bcTE is greater than acTE there is a mistake so set both to the avg of the two
        if(bcTE > acTE){
          avg = (bcTE + acTE) /2;
          bcTE = avg;
          acTE = avg;
        }

        // If bcNTE is greater than acNTE there is a mistake so set both to the avg of the two
        if(bcNTE > acNTE){
          avg = (bcNTE + acNTE) /2;
          bcNTE = avg;
          acNTE = avg;
        }

        console.log('testing - bcte', bcTE, 'bcNTE', bcNTE);
        console.log('testing - acte', acTE, 'acNTE', acNTE);

        if (isNaN(acTE) || isNaN(acNTE) || isNaN(bcTE) || isNaN(bcNTE)){
          console.log('----------Missing Data--------');
          $window.alert(configConstants.NO_BC_DATA);
        }
        return maskerPlateau(acTE,acNTE,bcTE,bcNTE,conduction,level, masked);

    }

    function setPatientData(data) {
        patientData = data;
    }

    function getPatientData() {
        return patientData;
    }

}
