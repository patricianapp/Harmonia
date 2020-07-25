export type DateRange = [Date, Date];
// export type DateRange = [string, string];
export const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const initDates = (): DateRange => {
    const start = new Date();
    start.setUTCMinutes(0, 0, 0);
    const end = new Date(start);
    return [start, end];
}

export const getDateRangeDay = (resetHour: number): DateRange => {
    const [start, end] = initDates();
    if(start.getUTCHours() < resetHour) {
        start.setUTCDate(start.getUTCDate() - 1);
    } else {
        end.setUTCDate(start.getUTCDate() + 1);
    }
    start.setUTCHours(resetHour);
    end.setUTCHours(resetHour);

    return [start, end];
}

export const getDateRangeWeek = (resetDay: number, resetHour: number): DateRange => {
    const [start, end] = initDates();

    let difference = start.getUTCDay() - resetDay;
    if(difference < 0) {
        difference += 7;
    }
    start.setUTCDate(start.getUTCDate() - difference);
    end.setUTCDate(start.getUTCDate() + 7);

    start.setUTCHours(resetHour);
    end.setUTCHours(resetHour);

    return [start, end];
}

export const getDateRangeMonth = (utcOffset: number): DateRange => {
    const [start, end] = initDates();

    end.setMonth(start.getMonth() + 1);
    start.setUTCDate(1);
    end.setUTCDate(1);
    start.setUTCHours(0 - utcOffset);
    end.setUTCHours(0 - utcOffset);
    return [start, end];
}


