import { formatDate, formatTime, formatDateTime, getRelativeTime, getDateRange, getWeekRange, getMonthRange, getYearRange, isToday, isYesterday, isThisWeek, isThisMonth, isThisYear, addDays, subtractDays, addWeeks, subtractWeeks, addMonths, subtractMonths, addYears, subtractYears, getDaysInMonth, getDaysInYear, isLeapYear, getWeekNumber, getMonthName, getDayName, getTimezoneOffset, formatTimezone, parseDate, isValidDate, compareDates, sortDates, filterDatesByRange, getDateDifference, getAge, getBusinessDays, getWeekendDays, getHolidays, isBusinessDay, isWeekend, isHoliday, getNextBusinessDay, getPreviousBusinessDay, getNextWeekend, getPreviousWeekend, getNextHoliday, getPreviousHoliday, getBusinessDaysInRange, getWeekendDaysInRange, getHolidaysInRange, getBusinessDaysInMonth, getWeekendDaysInMonth, getHolidaysInMonth, getBusinessDaysInYear, getWeekendDaysInYear, getHolidaysInYear, getBusinessDaysInQuarter, getWeekendDaysInQuarter, getHolidaysInQuarter, getBusinessDaysInSemester, getWeekendDaysInSemester, getHolidaysInSemester, getBusinessDaysInTrimester, getWeekendDaysInTrimester, getHolidaysInTrimester, getBusinessDaysInBimester, getWeekendDaysInBimester, getHolidaysInBimester } from '../../utils/dateUtils';

describe('dateUtils', () => {
  const testDate = new Date('2024-01-15T10:30:00Z');
  const testDate2 = new Date('2024-01-20T15:45:00Z');

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      expect(formatDate(testDate)).toBe('2024-01-15');
      expect(formatDate(testDate, 'MM/DD/YYYY')).toBe('01/15/2024');
      expect(formatDate(testDate, 'DD/MM/YYYY')).toBe('15/01/2024');
    });
  });

  describe('formatTime', () => {
    it('should format times correctly', () => {
      expect(formatTime(testDate)).toBe('10:30');
      expect(formatTime(testDate, 'HH:mm:ss')).toBe('10:30:00');
      expect(formatTime(testDate, 'h:mm A')).toBe('10:30 AM');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      expect(formatDateTime(testDate)).toBe('2024-01-15 10:30');
      expect(formatDateTime(testDate, 'MM/DD/YYYY HH:mm')).toBe('01/15/2024 10:30');
    });
  });

  describe('getRelativeTime', () => {
    it('should return relative time', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 60000); // 1 minute ago
      expect(getRelativeTime(past)).toBe('1 minute ago');
    });
  });

  describe('getDateRange', () => {
    it('should return date range', () => {
      const range = getDateRange(testDate, testDate2);
      expect(range.start).toEqual(testDate);
      expect(range.end).toEqual(testDate2);
    });
  });

  describe('getWeekRange', () => {
    it('should return week range', () => {
      const range = getWeekRange(testDate);
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
    });
  });

  describe('getMonthRange', () => {
    it('should return month range', () => {
      const range = getMonthRange(testDate);
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
    });
  });

  describe('getYearRange', () => {
    it('should return year range', () => {
      const range = getYearRange(testDate);
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
    });
  });

  describe('isToday', () => {
    it('should check if date is today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
      expect(isToday(testDate)).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('should check if date is yesterday', () => {
      const yesterday = new Date(Date.now() - 86400000);
      expect(isYesterday(yesterday)).toBe(true);
      expect(isYesterday(testDate)).toBe(false);
    });
  });

  describe('isThisWeek', () => {
    it('should check if date is this week', () => {
      const thisWeek = new Date();
      expect(isThisWeek(thisWeek)).toBe(true);
    });
  });

  describe('isThisMonth', () => {
    it('should check if date is this month', () => {
      const thisMonth = new Date();
      expect(isThisMonth(thisMonth)).toBe(true);
    });
  });

  describe('isThisYear', () => {
    it('should check if date is this year', () => {
      const thisYear = new Date();
      expect(isThisYear(thisYear)).toBe(true);
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const result = addDays(testDate, 5);
      expect(result.getDate()).toBe(20);
    });
  });

  describe('subtractDays', () => {
    it('should subtract days from date', () => {
      const result = subtractDays(testDate, 5);
      expect(result.getDate()).toBe(10);
    });
  });

  describe('addWeeks', () => {
    it('should add weeks to date', () => {
      const result = addWeeks(testDate, 2);
      expect(result.getDate()).toBe(29);
    });
  });

  describe('subtractWeeks', () => {
    it('should subtract weeks from date', () => {
      const result = subtractWeeks(testDate, 2);
      expect(result.getDate()).toBe(1);
    });
  });

  describe('addMonths', () => {
    it('should add months to date', () => {
      const result = addMonths(testDate, 1);
      expect(result.getMonth()).toBe(1); // February
    });
  });

  describe('subtractMonths', () => {
    it('should subtract months from date', () => {
      const result = subtractMonths(testDate, 1);
      expect(result.getMonth()).toBe(11); // December
    });
  });

  describe('addYears', () => {
    it('should add years to date', () => {
      const result = addYears(testDate, 1);
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe('subtractYears', () => {
    it('should subtract years from date', () => {
      const result = subtractYears(testDate, 1);
      expect(result.getFullYear()).toBe(2023);
    });
  });

  describe('getDaysInMonth', () => {
    it('should return days in month', () => {
      expect(getDaysInMonth(2024, 1)).toBe(29); // February 2024 (leap year)
      expect(getDaysInMonth(2024, 0)).toBe(31); // January
    });
  });

  describe('getDaysInYear', () => {
    it('should return days in year', () => {
      expect(getDaysInYear(2024)).toBe(366); // Leap year
      expect(getDaysInYear(2023)).toBe(365); // Regular year
    });
  });

  describe('isLeapYear', () => {
    it('should check if year is leap year', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2023)).toBe(false);
    });
  });

  describe('getWeekNumber', () => {
    it('should return week number', () => {
      const weekNumber = getWeekNumber(testDate);
      expect(weekNumber).toBeGreaterThan(0);
      expect(weekNumber).toBeLessThanOrEqual(53);
    });
  });

  describe('getMonthName', () => {
    it('should return month name', () => {
      expect(getMonthName(testDate)).toBe('January');
      expect(getMonthName(testDate, 'short')).toBe('Jan');
    });
  });

  describe('getDayName', () => {
    it('should return day name', () => {
      expect(getDayName(testDate)).toBe('Monday');
      expect(getDayName(testDate, 'short')).toBe('Mon');
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return timezone offset', () => {
      const offset = getTimezoneOffset(testDate);
      expect(typeof offset).toBe('number');
    });
  });

  describe('formatTimezone', () => {
    it('should format timezone', () => {
      const timezone = formatTimezone(testDate);
      expect(typeof timezone).toBe('string');
    });
  });

  describe('parseDate', () => {
    it('should parse date strings', () => {
      const parsed = parseDate('2024-01-15');
      expect(parsed).toBeDefined();
      expect(parsed.getFullYear()).toBe(2024);
    });
  });

  describe('isValidDate', () => {
    it('should validate dates', () => {
      expect(isValidDate(testDate)).toBe(true);
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });
  });

  describe('compareDates', () => {
    it('should compare dates', () => {
      expect(compareDates(testDate, testDate2)).toBe(-1);
      expect(compareDates(testDate2, testDate)).toBe(1);
      expect(compareDates(testDate, testDate)).toBe(0);
    });
  });

  describe('sortDates', () => {
    it('should sort dates', () => {
      const dates = [testDate2, testDate];
      const sorted = sortDates(dates);
      expect(sorted[0]).toEqual(testDate);
      expect(sorted[1]).toEqual(testDate2);
    });
  });

  describe('filterDatesByRange', () => {
    it('should filter dates by range', () => {
      const dates = [testDate, testDate2];
      const filtered = filterDatesByRange(dates, testDate, testDate2);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('getDateDifference', () => {
    it('should return date difference', () => {
      const diff = getDateDifference(testDate, testDate2);
      expect(diff.days).toBe(5);
    });
  });

  describe('getAge', () => {
    it('should calculate age', () => {
      const birthDate = new Date('1990-01-01');
      const age = getAge(birthDate);
      expect(age).toBeGreaterThan(30);
    });
  });

  describe('getBusinessDays', () => {
    it('should return business days', () => {
      const businessDays = getBusinessDays(testDate, testDate2);
      expect(businessDays).toBeGreaterThan(0);
    });
  });

  describe('getWeekendDays', () => {
    it('should return weekend days', () => {
      const weekendDays = getWeekendDays(testDate, testDate2);
      expect(weekendDays).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHolidays', () => {
    it('should return holidays', () => {
      const holidays = getHolidays(testDate, testDate2);
      expect(Array.isArray(holidays)).toBe(true);
    });
  });

  describe('isBusinessDay', () => {
    it('should check if date is business day', () => {
      const monday = new Date('2024-01-15'); // Monday
      expect(isBusinessDay(monday)).toBe(true);
    });
  });

  describe('isWeekend', () => {
    it('should check if date is weekend', () => {
      const saturday = new Date('2024-01-13'); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });
  });

  describe('isHoliday', () => {
    it('should check if date is holiday', () => {
      const newYear = new Date('2024-01-01');
      expect(isHoliday(newYear)).toBe(true);
    });
  });

  describe('getNextBusinessDay', () => {
    it('should return next business day', () => {
      const next = getNextBusinessDay(testDate);
      expect(next).toBeDefined();
    });
  });

  describe('getPreviousBusinessDay', () => {
    it('should return previous business day', () => {
      const previous = getPreviousBusinessDay(testDate);
      expect(previous).toBeDefined();
    });
  });

  describe('getNextWeekend', () => {
    it('should return next weekend', () => {
      const next = getNextWeekend(testDate);
      expect(next).toBeDefined();
    });
  });

  describe('getPreviousWeekend', () => {
    it('should return previous weekend', () => {
      const previous = getPreviousWeekend(testDate);
      expect(previous).toBeDefined();
    });
  });

  describe('getNextHoliday', () => {
    it('should return next holiday', () => {
      const next = getNextHoliday(testDate);
      expect(next).toBeDefined();
    });
  });

  describe('getPreviousHoliday', () => {
    it('should return previous holiday', () => {
      const previous = getPreviousHoliday(testDate);
      expect(previous).toBeDefined();
    });
  });

  describe('getBusinessDaysInRange', () => {
    it('should return business days in range', () => {
      const days = getBusinessDaysInRange(testDate, testDate2);
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('getWeekendDaysInRange', () => {
    it('should return weekend days in range', () => {
      const days = getWeekendDaysInRange(testDate, testDate2);
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHolidaysInRange', () => {
    it('should return holidays in range', () => {
      const holidays = getHolidaysInRange(testDate, testDate2);
      expect(Array.isArray(holidays)).toBe(true);
    });
  });

  describe('getBusinessDaysInMonth', () => {
    it('should return business days in month', () => {
      const days = getBusinessDaysInMonth(testDate);
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('getWeekendDaysInMonth', () => {
    it('should return weekend days in month', () => {
      const days = getWeekendDaysInMonth(testDate);
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHolidaysInMonth', () => {
    it('should return holidays in month', () => {
      const holidays = getHolidaysInMonth(testDate);
      expect(Array.isArray(holidays)).toBe(true);
    });
  });

  describe('getBusinessDaysInYear', () => {
    it('should return business days in year', () => {
      const days = getBusinessDaysInYear(testDate);
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('getWeekendDaysInYear', () => {
    it('should return weekend days in year', () => {
      const days = getWeekendDaysInYear(testDate);
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHolidaysInYear', () => {
    it('should return holidays in year', () => {
      const holidays = getHolidaysInYear(testDate);
      expect(Array.isArray(holidays)).toBe(true);
    });
  });

  describe('getBusinessDaysInQuarter', () => {
    it('should return business days in quarter', () => {
      const days = getBusinessDaysInQuarter(testDate);
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('getWeekendDaysInQuarter', () => {
    it('should return weekend days in quarter', () => {
      const days = getWeekendDaysInQuarter(testDate);
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHolidaysInQuarter', () => {
    it('should return holidays in quarter', () => {
      const holidays = getHolidaysInQuarter(testDate);
      expect(Array.isArray(holidays)).toBe(true);
    });
  });

  describe('getBusinessDaysInSemester', () => {
    it('should return business days in semester', () => {
      const days = getBusinessDaysInSemester(testDate);
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('getWeekendDaysInSemester', () => {
    it('should return weekend days in semester', () => {
      const days = getWeekendDaysInSemester(testDate);
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHolidaysInSemester', () => {
    it('should return holidays in semester', () => {
      const holidays = getHolidaysInSemester(testDate);
      expect(Array.isArray(holidays)).toBe(true);
    });
  });

  describe('getBusinessDaysInTrimester', () => {
    it('should return business days in trimester', () => {
      const days = getBusinessDaysInTrimester(testDate);
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('getWeekendDaysInTrimester', () => {
    it('should return weekend days in trimester', () => {
      const days = getWeekendDaysInTrimester(testDate);
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHolidaysInTrimester', () => {
    it('should return holidays in trimester', () => {
      const holidays = getHolidaysInTrimester(testDate);
      expect(Array.isArray(holidays)).toBe(true);
    });
  });

  describe('getBusinessDaysInBimester', () => {
    it('should return business days in bimester', () => {
      const days = getBusinessDaysInBimester(testDate);
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('getWeekendDaysInBimester', () => {
    it('should return weekend days in bimester', () => {
      const days = getWeekendDaysInBimester(testDate);
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHolidaysInBimester', () => {
    it('should return holidays in bimester', () => {
      const holidays = getHolidaysInBimester(testDate);
      expect(Array.isArray(holidays)).toBe(true);
    });
  });
});