import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'readableCron'
})
export class ReadableCronPipe implements PipeTransform {
  transform(cron: string): string {
    const cronParts = cron.split(' ');
    const minute = cronParts[0];
    const hour = cronParts[1];
    const dayOfMonth = cronParts[2];
    const month = cronParts[3];
    const dayOfWeek = cronParts[4];

    let readableCron = '';

    readableCron += this.parseMinute(minute);
    readableCron += this.parseHour(hour);
    readableCron += this.parseDayOfMonth(dayOfMonth);
    readableCron += this.parseMonth(month);
    readableCron += this.parseDayOfWeek(dayOfWeek);

    return readableCron.trim();
  }

  private parseMinute(minute: string): string {
    if (minute === '*') {
      return 'Every minute';
    } else if (minute === '0') {
      return '';
    } else {
      return `At minute ${minute}`;
    }
  }

  private parseHour(hour: string): string {
    if (hour === '*') {
      return ' of every hour';
    } else {
      return ` at ${hour.padStart(2, '0')}:00`;
    }
  }

  private parseDayOfMonth(dayOfMonth: string): string {
    if (dayOfMonth === '*') {
      return '';
    } else {
      return ` on day ${dayOfMonth}`;
    }
  }

  private parseMonth(month: string): string {
    if (month === '*') {
      return '';
    } else {
      return ` of month ${month}`;
    }
  }

  private parseDayOfWeek(dayOfWeek: string): string {
    if (dayOfWeek === '*') {
      return '';
    } else {
      return ` on ${this.getDayOfWeekName(dayOfWeek)}`;
    }
  }

  private getDayOfWeekName(dayOfWeek: string): string {
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];

    if (dayOfWeek.includes(',')) {
      const days = dayOfWeek.split(',').map(day => daysOfWeek[parseInt(day, 10)]).join(', ');
      return `these days: ${days}`;
    } else {
      return daysOfWeek[parseInt(dayOfWeek, 10)];
    }
  }
}
