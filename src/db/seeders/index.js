'use strict'

import models from '../models/index';
import roleSeed from './roleSeed';
import employeeSeed from './employeeSeed';
import emotionSeed from './emotionSeed';
import categorySeed from './categorySeed';
import waitingListSeed from './waitingListSeed';
import counterSeed from './counterSeed';
// import sessionSeed from './sessionSeed';
import serviceSeed from './serviceSeed';
//junction seeds
// import sessionServiceSeed from './sessionServiceSeed';
import counterCategorySeed from './counterCategorySeed';
import shiftSeed from './shiftSeed'
// import employeeShiftSeed from './employeeShiftSeed';
// import negativeEmotionCriteriaSeed from './negativeEmotionCriteriaSeed';
// import negativeEmotionActionSeed from './negativeEmotionActionSeed';
// import stressCriteriaSeed from './stressCriteriaSeed';
// import stressSuggestionSeed from './stressSuggestionSeed';
const seed = async () => {
  //check if data already exists.
  await models.Role.count()
    .then((count) => {
      //if there's no data, seed
      if (count == 0) {
        models.Role.bulkCreate(roleSeed)
          //library seeds
          .then(() => models.Emotion.bulkCreate(emotionSeed))
          .then(() => models.Category.bulkCreate(categorySeed))
          .then(() => models.Shift.bulkCreate(shiftSeed))
          // .then(() => models.NegativeEmotionCriteria.bulkCreate(negativeEmotionCriteriaSeed))
          // .then(() => models.NegativeEmotionAction.bulkCreate(negativeEmotionActionSeed))
          // .then(() => models.StressCriteria.bulkCreate(stressCriteriaSeed))
          // .then(() => models.StressSuggestion.bulkCreate(stressSuggestionSeed))
          //sample data seeds
          .then(() => models.Counter.bulkCreate(counterSeed))
          .then(() => models.Employee.bulkCreate(employeeSeed))
          .then(() => {
            const timer = ms => new Promise(res => setTimeout(res, ms))

            async function load () { // We need to wrap the loop into an async function for this to work
              for (var i = 0; i < waitingListSeed.length; i++) {
                models.WaitingList.create(waitingListSeed[i])
                await timer(1500); // then the created Promise can be awaited
              }
            }
            load();          
          })
          .then(() => models.Service.bulkCreate(serviceSeed))
          //junction seeds
          .then(() => models.CounterCategory.bulkCreate(counterCategorySeed))
          // .then(() => models.EmployeeShift.bulkCreate(employeeShiftSeed))
          // .then(() => models.Session.bulkCreate(sessionSeed))
          // .then(() => models.SessionService.bulkCreate(sessionServiceSeed))
          .then((res, err) => {
            if (err) {
              console.log(`ERROR at seeding data: ${err}`);
            } else {
              console.log("Data seeding successfully.");
            }
          })
      } else {
        console.log("Data synced. No seeding action was started.")
      }
    });
};

export default seed;
