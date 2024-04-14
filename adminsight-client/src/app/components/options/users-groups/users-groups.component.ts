import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';

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
              shell
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
              users
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

  openDeleteUserModal(user: User) {
    this.deleteUserForm = { ...user };
    this.showDeleteUserModal = true;
  }

  closeDeleteUserModal() {
    this.showDeleteUserModal = false;
    this.deleteUserForm = { name: '', uid: 0, homeDir: '', shell: '', isEditing: false };
  }

  deleteUser() {
    // Lógica para eliminar el usuario
    console.log(`Eliminando usuario: ${this.deleteUserForm.name}`);
    this.closeDeleteUserModal();
  }

  openDeleteGroupModal(group: Group) {
    this.deleteGroupForm = { ...group };
    this.showDeleteGroupModal = true;
  }

  closeDeleteGroupModal() {
    this.showDeleteGroupModal = false;
    this.deleteGroupForm = { name: '', gid: 0, users: [], isEditing: false };
  }

  deleteGroup() {
    // Lógica para eliminar el grupo
    console.log(`Eliminando grupo: ${this.deleteGroupForm.name}`);
    this.closeDeleteGroupModal();
  }

  saveUser(user: User) {
    // Lógica para guardar los cambios del usuario
    console.log(`Guardando cambios del usuario: ${user.name}`);
    user.isEditing = false;
  }

  saveGroup(group: Group) {
    // Lógica para guardar los cambios del grupo
    console.log(`Guardando cambios del grupo: ${group.name}`);
    group.isEditing = false;
  }
}