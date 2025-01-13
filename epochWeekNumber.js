/*
 -----------------------------------------------------------------------------------------------

                    Papillon's custom system for week number since 01/01/1970

 This part is for handleing the date conversion from JS date, Pronote's week number and our
 "epochWeekNumber" (which try to represent the total number of weeks since the UNIX epoch, aka
 1st January 1970). It can be a little be messy but it's the best way I found to handle the date
 conversion between the different systems. I tried to make it as simple as possible and modular,
 and I added a ton of comments to help u. If you still have a question, feel free to ask me. - NonozgYtb ;)

 -----------------------------------------------------------------------------------------------
*/

const EPOCH_WN_CONFIG = {
  setHour: 6, // We are in Europe, so we set the hour to 6 UTC to avoid any problem with the timezone (= 2h in the morning in Summer Paris timezone)
  setStartDay: 1, // We set the first day of the week to Monday to ensure that the week number is the same for the whole world
  setMiddleDay: 3, // We set the middle day of the week to Wednesday to ensure <... same than above ...>
  setEndDay: 7, // We set the last day of the week to Sunday to ensure <...>
  numberOfMsInAWeek: 1000 /* ms */ * 60 /* s */ * 60 /* min */ * 24 /* h */ * 7, /* days */
  adjustEpochInitialDate: 259200000, // =(((new Date(0)).getDay()-1) * EPOCH_WN_CONFIG.numberOfMsInAWeek/7) // We need to substract this for having a good range cause 01/01/1970 was not a Monday and the "-1" is to have Monday as the first day of the week
};

export const weekNumberToDateRange = (epochWeekNumber, numberOfWeeksBefore = 0, numberOfWeeksAfter = 0) => {
  const start = new Date(
    epochWeekNumber * EPOCH_WN_CONFIG.numberOfMsInAWeek
    - EPOCH_WN_CONFIG.adjustEpochInitialDate
    - numberOfWeeksBefore * EPOCH_WN_CONFIG.numberOfMsInAWeek
  );
  const end = new Date(
    epochWeekNumber * EPOCH_WN_CONFIG.numberOfMsInAWeek
    + ( 6/7 ) * EPOCH_WN_CONFIG.numberOfMsInAWeek // 6/7 is to have the end of the week, aka Sunday (we are in Europe so we dont need to worry if we want to include the Sunday)
    - EPOCH_WN_CONFIG.adjustEpochInitialDate
    + numberOfWeeksAfter * EPOCH_WN_CONFIG.numberOfMsInAWeek
  );
  return { start, end };
};
