import { Injectable } from '@angular/core';
import { User, Group } from '../components/options/users-groups/users-groups.component';

@Injectable({
  providedIn: 'root'
})
export class UsersGroupsService {
  constructor() { }

  generateUserUpdateCommands(updatedUser: User, originalUser: User): string[] {
    const commands: string[] = [];

    if (updatedUser.name !== originalUser.name) {
      commands.push(`usermod -l ${updatedUser.name} ${originalUser.name}`);
    }

    if (updatedUser.homeDir !== originalUser.homeDir) {
      commands.push(`usermod -d ${updatedUser.homeDir} ${updatedUser.name}`);
    }

    if (updatedUser.shell !== originalUser.shell) {
      commands.push(`usermod -s ${updatedUser.shell} ${updatedUser.name}`);
    }

    return commands;
  }

  generateGroupUpdateCommands(updatedGroup: Group, originalGroup: Group): string[] {
    const commands: string[] = [];

    if (updatedGroup.name !== originalGroup.name) {
      commands.push(`groupmod -n ${updatedGroup.name} ${originalGroup.name}`);
    }

    const newUsers = updatedGroup.users.join(',');
    const oldUsers = (originalGroup.users || []).join(',');

    if (newUsers !== oldUsers) {
      const oldUsersArray = oldUsers.split(',').filter(Boolean);
      const newUsersArray = newUsers.split(',');

      const usersToRemove = oldUsersArray.filter(user => !newUsersArray.includes(user));
      const usersToAdd = newUsersArray.filter(user => !oldUsersArray.includes(user));

      usersToRemove.forEach(user => {
        commands.push(`gpasswd -d ${user} ${updatedGroup.name}`);
      });

      usersToAdd.forEach(user => {
        commands.push(`usermod -aG ${updatedGroup.name} ${user}`);
      });
    }

    return commands;
  }
}