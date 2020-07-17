// export type DateRange = [Date, Date];
export type DateRange = [string, string];
export const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const getDateRangeDay = (resetHour: number): DateRange => {
    const start = new Date();
    const end = new Date();
    if(start.getHours() < resetHour) {
        start.setDate(start.getDate() - 1);
    } else {
        end.setDate(start.getDate() + 1);
    }
    start.setHours(resetHour);
    end.setHours(resetHour);

    return [ start.toISOString().replace('T', ' '), end.toISOString().replace('T', ' ') ];
}

export const getDateRangeWeek = (resetDay: number, resetHour: number): DateRange => {
    const start = new Date();
    const end = new Date();

    let difference = start.getDay() - resetDay;
    if(difference < 0) {
        difference += 7;
    }
    start.setDate(start.getDate() - difference);
    end.setDate(start.getDate() + 7);

    start.setHours(resetHour);
    end.setHours(resetHour);

    return [ start.toISOString().replace('T', ' '), end.toISOString().replace('T', ' ') ];
}

export const getDateRangeMonth = (): DateRange => {
    const start = new Date();
    const end = new Date();

    end.setMonth(start.getMonth() + 1);
    start.setDate(0);
    end.setDate(0);
    return [ start.toISOString().replace('T', ' '), end.toISOString().replace('T', ' ') ];
}


