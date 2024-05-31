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

    if (minute === '*') {
      readableCron += 'Cada minuto';
    } else {
      readableCron += `Minuto ${minute}`;
    }

    if (hour === '*') {
      readableCron += ' de cada hora';
    } else {
      readableCron += ` a las ${hour}:00`;
    }

    if (dayOfMonth !== '*') {
      readableCron += ` el día ${dayOfMonth}`;
    }

    if (month !== '*') {
      readableCron += ` del mes ${month}`;
    }

    if (dayOfWeek !== '*') {
      readableCron += ` los ${this.getDayOfWeekName(dayOfWeek)}`;
    }

    return readableCron.trim();
  }

  private getDayOfWeekName(dayOfWeek: string): string {
    switch (dayOfWeek) {
      case '0':
        return 'domingos';
      case '1':
        return 'lunes';
      case '2':
        return 'martes';
      case '3':
        return 'miércoles';
      case '4':
        return 'jueves';
      case '5':
        return 'viernes';
      case '6':
        return 'sábados';
      default:
        return '';
    }
  }
}