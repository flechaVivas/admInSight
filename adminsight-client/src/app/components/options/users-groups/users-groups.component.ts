import { Component, OnInit, ViewChild } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { PasswordModalComponent } from '../../modals/password-modal/password-modal.component';
import { UsersGroupsService } from '../../../services/users-groups.service';

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

  editingUser: User | null = null;
  originalUser: User | null = null;
  editingGroup: Group | null = null;
  originalGroup: Group | null = null;


  constructor(private sshService: SshService,
    private router: Router,
    private usersGroupsService: UsersGroupsService,
  ) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  sudoPassword: string = '';
  @ViewChild(PasswordModalComponent) passwordModal!: PasswordModalComponent;
  showPasswordModal: boolean = false;

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

  commandsToExecute: string[] = [];
  private executeCommands(commands: string[], sudoPassword?: string) {
    const sudoCommands = commands.map(command => `echo '${sudoPassword}' | sudo -S ${command}`);
    this.sshService.executeCommand(this.systemId, sudoCommands)
      .subscribe(
        (response: any) => {
          console.log(response);
          this.fetchUserInfo();
          this.fetchGroupInfo();
        },
        (error) => {
          console.error('Error al ejecutar los comandos:', error);
        }
      );
  }

  onPasswordConfirm(sudoPassword: string) {
    const sudoCommands = this.commandsToExecute.map(command => `echo '${sudoPassword}' | sudo -S ${command}`);
    this.executeCommands(sudoCommands, sudoPassword);
    this.showPasswordModal = false;
    this.commandsToExecute = [];
    this.sudoPassword = '';
  }

  onPasswordCancel() {
    this.showPasswordModal = false;
    this.commandsToExecute = [];
    this.sudoPassword = '';
  }

  // DELETE USER
  deleteUser(user: User) {
    this.deleteUserForm = { ...user };
    this.showPasswordModal = true;
    this.commandsToExecute = [`userdel ${user.name}`];
  }

  confirmDeleteUser() {
    this.commandsToExecute = [`userdel ${this.deleteUserForm.name}`];
    this.showPasswordModal = true;
  }

  cancelDeleteUser() {
    this.showPasswordModal = false;
    this.sudoPassword = '';
  }

  // EDIT USER
  editUser(user: User) {
    this.editingUser = { ...user };
    this.users.forEach(u => u.isEditing = false);
    user.isEditing = true;
  }

  saveUserChanges(user: User) {
    if (this.editingUser) {
      const originalUser = this.users.find(u => u.uid === this.editingUser!.uid);

      if (originalUser) {
        const commands = this.usersGroupsService.generateUserUpdateCommands(this.editingUser, originalUser);

        if (commands.length > 0) {
          this.commandsToExecute = commands;
          this.showPasswordModal = true;
        } else {
          user.isEditing = false;
          this.editingUser = null;
        }
      }
    }
  }

  // EDIT GROUP
  editGroup(group: Group) {
    this.editingGroup = { ...group };
    this.groups.forEach(g => g.isEditing = false);
    group.isEditing = true;
  }
  saveGroupChanges(group: Group) {
    if (this.editingGroup) {
      const originalGroup = this.groups.find(g => g.gid === this.editingGroup!.gid);

      if (originalGroup) {
        const commands = this.usersGroupsService.generateGroupUpdateCommands(this.editingGroup, originalGroup);

        if (commands.length > 0) {
          this.commandsToExecute = commands;
          this.showPasswordModal = true;
        } else {
          group.isEditing = false;
          this.editingGroup = null;
        }
      }
    }
  }

  // DELETE GROUP
  deleteGroup(group: Group) {
    this.deleteGroupForm = { ...group };
    this.showPasswordModal = true;
    this.commandsToExecute = [`groupdel ${group.name}`];
  }

  confirmDeleteGroup() {
    this.commandsToExecute = [`groupdel ${this.deleteGroupForm.name}`];
    this.showPasswordModal = true;
  }

  cancelDeleteGroup() {
    this.showDeleteGroupModal = false;
    this.sudoPassword = '';
  }

  onUserNameChange(user: User) {
    if (this.editingUser && this.originalUser) {
      this.editingUser.name = user.name;
    }
  }

  onUserHomeDirChange(user: User) {
    if (this.editingUser && this.originalUser) {
      this.editingUser.homeDir = user.homeDir;
    }
  }

  onUserShellChange(user: User) {
    if (this.editingUser && this.originalUser) {
      this.editingUser.shell = user.shell;
    }
  }

  onGroupNameChange(group: Group) {
    if (this.editingGroup && this.originalGroup) {
      this.editingGroup.name = group.name;
    }
  }

  onGroupUsersChange(group: Group) {
    if (this.editingGroup && this.originalGroup) {
      this.editingGroup.users = group.users;
    }
  }


}