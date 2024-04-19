import { Pipe, PipeTransform } from '@angular/core';
import { User, Group } from './users-groups.component';

@Pipe({
  name: 'filterUsers'
})
export class FilterUsersPipe implements PipeTransform {
  transform(users: User[], searchTerm: string): User[] {
    if (!searchTerm) {
      return users;
    }

    searchTerm = searchTerm.toLowerCase();

    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm) ||
      user.uid.toString().includes(searchTerm) ||
      user.homeDir.toLowerCase().includes(searchTerm) ||
      user.shell.toLowerCase().includes(searchTerm)
    );
  }
}

@Pipe({
  name: 'filterGroups'
})
export class FilterGroupsPipe implements PipeTransform {
  transform(groups: Group[], searchTerm: string): Group[] {
    if (!searchTerm) {
      return groups;
    }

    searchTerm = searchTerm.toLowerCase();

    return groups.filter(group =>
      group.name.toLowerCase().includes(searchTerm) ||
      group.gid.toString().includes(searchTerm) ||
      group.users.join(',').toLowerCase().includes(searchTerm)
    );
  }
}