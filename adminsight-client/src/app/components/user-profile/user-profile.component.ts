import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  userProfileForm: FormGroup;
  changePasswordForm: FormGroup;
  userData: any;
  isLoading: boolean = false;
  isPasswordChangeSuccess: boolean = false;
  passwordChangeError: string = '';
  showDeleteAccountModal: boolean = false;
  isUpdateProfileSuccess: boolean = false;
  updateProfileError: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private router: Router
  ) {
    this.userProfileForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmNewPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.userData = this.userProfileService.getUserData();
    this.userProfileForm.patchValue({
      username: this.userData.username,
      email: this.userData.email
    });
  }

  onUpdateProfile(): void {
    this.isLoading = true;
    this.isUpdateProfileSuccess = false;
    this.updateProfileError = '';

    const { username, email } = this.userProfileForm.value;

    this.authService.updateUserProfile(username, email)
      .subscribe(
        () => {
          this.isUpdateProfileSuccess = true;
          this.updateProfileError = '';
          this.isLoading = false;
          this.userData.username = username;
          this.userData.email = email;
          this.authService.setLoggedInUser(this.userData);
        },
        (error) => {
          this.updateProfileError = 'Error al actualizar el perfil de usuario';
          this.isLoading = false;
        }
      );
  }

  onChangePassword(): void {
    this.isLoading = true;
    const { currentPassword, newPassword, confirmNewPassword } = this.changePasswordForm.value;

    if (newPassword !== confirmNewPassword) {
      this.passwordChangeError = 'Las nuevas contraseñas no coinciden';
      this.isLoading = false;
      return;
    }

    // Lógica para cambiar la contraseña del usuario
    this.authService.changePassword(currentPassword, newPassword)
      .subscribe(
        () => {
          this.isPasswordChangeSuccess = true;
          this.passwordChangeError = '';
          this.isLoading = false;
          this.changePasswordForm.reset();
        },
        (error) => {
          this.passwordChangeError = 'Error al cambiar la contraseña';
          this.isLoading = false;
        }
      );
  }

  openDeleteAccountModal(): void {
    this.showDeleteAccountModal = true;
  }

  closeDeleteAccountModal(): void {
    this.showDeleteAccountModal = false;
  }

  deleteAccount(): void {
    // Lógica para eliminar la cuenta del usuario
    this.authService.deleteAccount().subscribe(
      () => {
        this.closeDeleteAccountModal();
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error('Error al eliminar la cuenta:', error);
        // Puedes mostrar un mensaje de error al usuario si es necesario
      }
    );
  }
}