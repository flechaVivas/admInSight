import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { PasswordModalComponent } from '../../modals/password-modal/password-modal.component';

export interface User {
  name: string;
  uid: number;
  homeDir: string;
  shell: string;
  isEditing: boolean;
}

export interface Group {
  name: string;
  gid: number;
  users: string[];
  isEditing: boolean;
}

@Component({
  selector: 'app-users-groups',
  templateUrl: './users-groups.component.html',
  styleUrls: ['./users-groups.component.css']
})
export class UsersGroupsComponent implements OnInit {
  users: User[] = [];
  groups: Group[] = [];
  filteredUsers: User[] = [];
  filteredGroups: Group[] = [];
  searchUserTerm: string = '';
  searchGroupTerm: string = '';
  sortUserColumn: string = 'name';
  sortUserDirection: string = 'asc';
  sortGroupColumn: string = 'name';
  sortGroupDirection: string = 'asc';

  activeTab: 'users' | 'groups' = 'users';
  searchTerm: string = '';

  showDeleteUserModal: boolean = false;
  deleteUserForm: User = { name: '', uid: 0, homeDir: '', shell: '', isEditing: false };

  showDeleteGroupModal: boolean = false;
  deleteGroupForm: Group = { name: '', gid: 0, users: [], isEditing: false };

  sudoPassword: string = '';

  constructor(private sshService: SshService, private router: Router) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  ngOnInit() {
    if (this.systemId) {
      this.fetchUserInfo();
      this.fetchGroupInfo();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  fetchUserInfo() {
    const commands = [
      'cut -d: -f1,3,6,7 /etc/passwd'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          const output = response['cut -d: -f1,3,6,7 /etc/passwd']?.stdout || '';
          const lines = output.trim().split('\n');

          this.users = lines.map((line: string) => {
            const [name, uid, homeDir, shell] = line.split(':');
            return {
              name,
              uid: parseInt(uid, 10),
              homeDir,
              shell,
              isEditing: false
            };
          });

          this.filteredUsers = [...this.users];
        },
        (error) => {
          console.error('Error al obtener la información de los usuarios:', error);
        }
      );
  }

  fetchGroupInfo() {
    const commands = [
      'cut -d: -f1,3 /etc/group',
      'getent group | cut -d: -f1,4'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          const groupOutput = response['cut -d: -f1,3 /etc/group']?.stdout || '';
          const groupLines = groupOutput.trim().split('\n');

          const userOutput = response['getent group | cut -d: -f1,4']?.stdout || '';
          const userLines = userOutput.trim().split('\n');

          this.groups = groupLines.map((line: string) => {
            const [name, gid] = line.split(':');
            const users = userLines.filter((userLine: string) => userLine.includes(name)).flatMap((userLine: string) => userLine.split(':')[1].split(',')).filter(Boolean);
            return {
              name,
              gid: parseInt(gid, 10),
              users,
              isEditing: false
            };
          });

          this.filteredGroups = [...this.groups];
        },
        (error) => {
          console.error('Error al obtener la información de los grupos:', error);
        }
      );
  }

  sortUsers(column: string) {
    if (this.sortUserColumn === column) {
      this.sortUserDirection = this.sortUserDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortUserColumn = column;
      this.sortUserDirection = 'asc';
    }
  }

  sortGroups(column: string) {
    if (this.sortGroupColumn === column) {
      this.sortGroupDirection = this.sortGroupDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortGroupColumn = column;
      this.sortGroupDirection = 'asc';
    }
  }

  // DELETE USER
  deleteUser(usuarioActual: User) {
    this.deleteUserForm = { ...usuarioActual };
    this.showDeleteUserModal = true;
  }

  confirmDeleteUser() {
    const commands = [`sudo userdel ${this.deleteUserForm.name}`];

    this.sshService.executeCommand(this.systemId, commands, this.sudoPassword)
      .subscribe(
        () => {
          this.fetchUserInfo();
          this.showDeleteUserModal = false;
          this.sudoPassword = '';
        },
        (error) => {
          console.error('Error al eliminar el usuario:', error);
        }
      );
  }

  cancelDeleteUser() {
    this.showDeleteUserModal = false;
    this.sudoPassword = '';
  }

  // EDIT USER

  editUser(user: User) {
    user.isEditing = true;
  }

  saveUserChanges(user: User) {
    const commands = [];

    if (user.name !== this.users.find(u => u.uid === user.uid)?.name) {
      commands.push(`sudo usermod -l ${user.name} ${this.users.find(u => u.uid === user.uid)?.name}`);
    }

    if (user.homeDir !== this.users.find(u => u.uid === user.uid)?.homeDir) {
      commands.push(`sudo usermod -d ${user.homeDir} ${user.name}`);
    }

    if (user.shell !== this.users.find(u => u.uid === user.uid)?.shell) {
      commands.push(`sudo usermod -s ${user.shell} ${user.name}`);
    }

    if (commands.length > 0) {
      this.sshService.executeCommand(this.systemId, commands, this.sudoPassword)
        .subscribe(
          () => {
            user.isEditing = false;
            this.fetchUserInfo();
            this.sudoPassword = '';
          },
          (error) => {
            console.error('Error al editar el usuario:', error);
          }
        );
    } else {
      user.isEditing = false;
    }
  }

  // EDIT GROUP

  editGroup(group: Group) {
    group.isEditing = true;
  }

  saveGroupChanges(group: Group) {
    const commands = [];

    if (group.name !== this.groups.find(g => g.gid === group.gid)?.name) {
      commands.push(`sudo groupmod -n ${group.name} ${this.groups.find(g => g.gid === group.gid)?.name}`);
    }

    const newUsers = group.users.join(',');
    const oldUsers = this.groups.find(g => g.gid === group.gid)?.users.join(',');

    if (newUsers !== oldUsers) {
      const oldUsersArray = oldUsers?.split(',') || [];
      const newUsersArray = newUsers.split(',');

      const usersToRemove = oldUsersArray.filter(user => !newUsersArray.includes(user));
      const usersToAdd = newUsersArray.filter(user => !oldUsersArray.includes(user));

      usersToRemove.forEach(user => {
        commands.push(`sudo gpasswd -d ${user} ${group.name}`);
      });

      usersToAdd.forEach(user => {
        commands.push(`sudo usermod -aG ${group.name} ${user}`);
      });
    }

    if (commands.length > 0) {
      this.sshService.executeCommand(this.systemId, commands, this.sudoPassword)
        .subscribe(
          () => {
            group.isEditing = false;
            this.fetchGroupInfo();
            this.sudoPassword = '';
          },
          (error) => {
            console.error('Error al editar el grupo:', error);
          }
        );
    } else {
      group.isEditing = false;
    }
  }

  // DELETE GROUP

  deleteGroup(group: Group) {
    this.deleteGroupForm = { ...group };
    this.showDeleteGroupModal = true;
  }

  confirmDeleteGroup() {
    const commands = [`sudo groupdel ${this.deleteGroupForm.name}`];

    this.sshService.executeCommand(this.systemId, commands, this.sudoPassword)
      .subscribe(
        () => {
          this.fetchGroupInfo();
          this.showDeleteGroupModal = false;
          this.sudoPassword = '';
        },
        (error) => {
          console.error('Error al eliminar el grupo:', error);
        }
      );
  }

  cancelDeleteGroup() {
    this.showDeleteGroupModal = false;
    this.sudoPassword = '';
  }


}