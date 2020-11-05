'use strict'

import models from '../db/models/index';
import { Op } from 'sequelize';
export const calculateShiftEmotionLevel = async (employee, shiftSessions, periodicityId) => {
  const negativeEmotionCriteria = await models.NegativeEmotionCriteria.findAndCountAll({
    include: {
      model: models.NegativeEmotionAction,
      attributes: [],
      where: {
        action: {
          [Op.not]: null,
        },
        periodicityId: periodicityId
      }
    }
  });
  let criteriaArray = []
  negativeEmotionCriteria.rows.forEach(criteria => {
    const criteriaString = criteria.condition;
    criteriaArray.push(criteriaString);
  })
  console.log(criteriaArray)
  //array to count the number of occurence of sessions
  let typeCount = Array.from({ length: criteriaArray.length }, () => 0)
  let sessionCount = 0;
  shiftSessions.forEach(shiftSession => {
    const sessions = shiftSession.Session;
    sessions.forEach(session => {
      if (session.info != undefined) {
        const parsedInfo = JSON.parse(session.info)
        const emotionDurations = parsedInfo.emotions_duration;
        // console.log(`======================================================= critlen:${criteriaArray.length}`)
        for (var i = 0; i < criteriaArray.length; i++) {
          const condition = convertConditions(emotionDurations, criteriaArray[i]);
          // console.log(`=====condEval:?${(condition)}`)
          // console.log(`MATCH?${eval(condition)}`)
          if (eval(condition)) {
            typeCount[i]++;
          }
        }
      }
      sessionCount++;
    });
  });
  console.log(`====typeCount:${typeCount}`)
  const action = await getNegativeEmotionAction(sessionCount, typeCount, periodicityId)
  const report = getEmployeeEmotionReport(employee, sessionCount, typeCount, negativeEmotionCriteria);
  console.log(`RESULT: ${action}`)
  return {
    action: action,
    report: report
  };
}

export const getNegativeEmotionAction = async (sessionCount, typeCount, periodicityId) => {
  // console.log(`periodicityId:${periodicityId}`)

  const negativeEmotionAction = await models.NegativeEmotionAction.findAll({
    where: {
      periodicity_id: periodicityId,
      action: {
        [Op.ne]: null,
      }
    }
  });
  let action = '';
  //find action by number limit
  // console.log(`===== acionlen:${negativeEmotionAction.length} `)
  // console.log(`===== typeclen:${typeCount.length} `)
  for (var i = typeCount.length - 1; i >= 0; --i) {
    for (var j = negativeEmotionAction.length - 1; j >= 0; --j) {
      if (negativeEmotionAction[j].limit != null && typeCount[i] >= parseInt(negativeEmotionAction[j].limit)) {
        action = negativeEmotionAction[j].action;

      //  console.log('action' + action)
        return action;
      }
      //console.log(`===PER:${typeCount[i] / sessionCount}`)
      // console.log(`=====DBPRER:${negativeEmotionAction[j].percentageLimit}`)
      if ((typeCount[i] / sessionCount) >= negativeEmotionAction[j].percentageLimit) {
        action = negativeEmotionAction[j].action;
       // console.log('PERCENTaction' + action)
        return action;
      }
    }
  }
  //find action by percentage limit
  if (action == '') {
    for (var i = negativeEmotionAction.length - 1; i > 0; --i) {
      if ((typeCount[i] / sessionCount) >= negativeEmotionAction.percentageLimit) {
        console.log("====ACTION:" + negativeEmotionAction[i].action)
        action = negativeEmotionAction[i].action
        return action;
      }
    }
  } return null;
}

export const getEmployeeEmotionReport = ((employee, sessionCount, typeCount, negativeEmotionCriteria) => {
  //getTotalsessions
  employee.setDataValue('totalSessions', sessionCount);
  let sessionTypes = [];
  let sessionTypeName
  let result;
  for (var i = 0; i < typeCount.length; i++) {
    let percentage = (typeCount[i] / sessionCount) * 100 + "%";
    sessionTypeName = negativeEmotionCriteria.rows[i].condition
    result = {
      "condition": sessionTypeName,
      "count": typeCount[i],
      "percentage": percentage
    }
    sessionTypes.push(result);
  }
  // console.log(sessionTypes)
  return sessionTypes;
});

// ===================== sterss-related functions
export const calculateStressLevel = async (shiftSessions, periodicityId) => {
  const stressCriteria = await models.StressCriteria.findAndCountAll();
  let criteriaArray = []

  stressCriteria.rows.forEach(criteria => {
    const criteriaString = criteria.condition + criteria.operator + criteria.comparingNumber;
    criteriaArray.push(criteriaString);
  })
  //array to count the number of occurence of sessions
  let typeCount = Array.from({ length: stressCriteria.count }, () => 0)
  let sessionCount = 0;
  shiftSessions.forEach(shiftSession => {
    const sessions = shiftSession.Session;
    sessions.forEach(session => {
      if (session.info != undefined) {
        const parsedInfo = JSON.parse(session.info)
        const emotionDurations = parsedInfo.emotions_duration;
        for (var i = 0; i < criteriaArray.length; i++) {
          const condition = convertConditions(emotionDurations, criteriaArray[i]);
          // console.log(`MATCH?${eval(condition)}`)
          if (eval(condition)) {
            typeCount[i]++;
          }
        }
      }
      sessionCount++;
    });
  });
  const suggestion = await getStressSuggestion(sessionCount, typeCount, periodicityId)
  // console.log(`RESULT: ${suggestion.url}`)
  return suggestion
}

export const getStressSuggestion = async (sessionCount, typeCount, periodicityId) => {
  // console.log(`=======TYPECOUNT:${typeCount}`)
  const stressSuggestion = await models.StressSuggestion.findAll({
    where: {
      periodicity_id: periodicityId
    }
  });
  let suggestion = '';
  let url = '';
  // console.log("=====find action by NUMBER limit");
  // for (var i = stressSuggestion.length - 1; i > 0; --i) {
  //   // console.log(`====== LIMIT: ${stressSuggestion[i].limit}`)
  //   if (stressSuggestion[i].limit != null && typeCount[i] >= parseInt(stressSuggestion[i].limit)) {
  //     // console.log(`=======SUGESTTION:${suggestion}`)
  //     url = stressSuggestion[i].link
  //     suggestion = stressSuggestion[i].suggestion

  //     return {
  //       url: url,
  //       suggestion: suggestion
  //     };
  //   }
  // }
  // console.log("=====find action by percentage limit");
  for (var i = stressSuggestion.length - 1; i > 0; --i) {
    if ((typeCount[i] / sessionCount) >= stressSuggestion.percentageLimit) {
      url = stressSuggestion[i].link
      suggestion = stressSuggestion[i].suggestion
      // console.log(`=======SUGESTTION:${suggestion}`)
      return {
        url: url,
        suggestion: suggestion
      };
    }
  } return null;
}

export const convertConditions = (emotions_duration, condition) => {
  var sumExpressions = condition.match(/\[([0-9],)*[0-9]*\]/g)
  sumExpressions.forEach(expression => {
    var sum = calsum(emotions_duration, expression)
    condition = condition.split(expression).join(sum)
  });
  // console.log(`====CONDITION: ${condition}`)
  return condition
}

function calsum(emotions_duration, emotionIndexes) {
  var array = JSON.parse(emotionIndexes)
  var sum = 0
  for (var i = 0; i < array.length; i++) {
    sum += emotions_duration[array[i]]
  }
  return sum
}

// export const calculateShiftEmotionLevel_OLD = (shiftSessions) => {
//   let positiveScoreSum = 0, negativeScoreSum = 0;
//   shiftSessions.forEach(shiftSession => {
//     const sessions = shiftSession.Session;
//     sessions.forEach(session => {
//       const emotionLevel = JSON.parse(session.info).emotion_level;
//       //if the emotion level is negative (-1<=level<0)
//       if (emotionLevel >= -1 && emotionLevel < 0) {
//         negativeScoreSum += ((2 / (1 + Math.exp(-10 * emotionLevel))) - 1) * emotionLevel;
//       }
//       //if the emotion level is positive (0<=level<=1)
//       if (emotionLevel >= 0 && emotionLevel <= 1) {
//         positiveScoreSum += ((2 / (1 + Math.exp(-3.7 * emotionLevel))) - 1) * emotionLevel;
//       }
//     });
//   });

//   const totalScoreSum = positiveScoreSum + negativeScoreSum;
//   const positivePercent = (positiveScoreSum / totalScoreSum) * 100;
//   const negativePercent = (negativeScoreSum / totalScoreSum) * 100;
//   const difference = positivePercent - negativePercent;
//   //2 / (1 +exp(-0.05*x)) -1
//   const shiftEmotionLevel = (2 / (1 + Math.exp(-0.05 * difference))) - 1;
//   return shiftEmotionLevel;
// }
