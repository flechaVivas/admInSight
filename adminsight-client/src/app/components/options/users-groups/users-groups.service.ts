import { Injectable } from '@angular/core';
import { User, Group } from './users-groups.component';

@Injectable({
  providedIn: 'root'
})
export class UsersGroupsService {
  constructor() { }

  generateUserUpdateCommands(updatedUser: User, originalUser: User): string[] {
    const commands: string[] = [];

    if (updatedUser.name !== originalUser.name) {
      commands.push(`usermod -l ${originalUser.name} ${updatedUser.name}`);
    }

    if (updatedUser.homeDir !== originalUser.homeDir) {
      commands.push(`usermod -d ${originalUser.homeDir} ${updatedUser.name}`);
    }

    if (updatedUser.shell !== originalUser.shell) {
      commands.push(`usermod -s ${originalUser.shell} ${updatedUser.name}`);
    }

    return commands;
  }

  generateGroupUpdateCommands(updatedGroup: Group, originalGroup: Group): string[] {
    const commands: string[] = [];

    if (updatedGroup.name !== originalGroup.name) {
      commands.push(`groupmod -n ${originalGroup.name} ${updatedGroup.name}`);
    }

    // Asegurándonos de que updatedGroup.users y originalGroup.users sean tratados como strings o arrays de strings
    const newUsers = typeof updatedGroup.users === 'string'
      ? (updatedGroup.users as string).split(',').map((u: string) => u.trim())
      : Array.isArray(updatedGroup.users) ? updatedGroup.users : [];

    const oldUsers = typeof originalGroup.users === 'string'
      ? (originalGroup.users as string).split(',').filter(Boolean)
      : Array.isArray(originalGroup.users) ? originalGroup.users : [];

    if (
      (Array.isArray(newUsers) && Array.isArray(oldUsers) && (newUsers.length !== oldUsers.length || newUsers.some((user, index) => user !== oldUsers[index]))) ||
      (!Array.isArray(newUsers) && !Array.isArray(oldUsers) && newUsers !== oldUsers)
    ) {
      const oldUsersArray = Array.isArray(oldUsers) ? oldUsers : [];
      const newUsersArray = Array.isArray(newUsers) ? newUsers : [];

      const usersToRemove = oldUsersArray.filter((user: string) => !newUsersArray.includes(user));
      const usersToAdd = newUsersArray.filter((user: string) => !oldUsersArray.includes(user));

      usersToAdd.forEach((user: string) => {
        commands.push(`gpasswd -d ${user} ${updatedGroup.name}`);
      });

      usersToRemove.forEach((user: string) => {
        commands.push(`gpasswd -a ${user} ${updatedGroup.name}`);
      });

    }

    return commands;
  }



}