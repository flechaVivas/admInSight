import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage.service';

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

  isLoadingProfile: boolean = false;
  isLoadingPassword: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private router: Router,
    private localStorage: LocalStorageService
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
    this.isLoadingProfile = true;
    this.isLoading = true;
    this.isUpdateProfileSuccess = false;
    this.updateProfileError = '';

    const { username, email } = this.userProfileForm.value;

    this.authService.updateUserProfile(username, email)
      .subscribe(
        (response) => {
          this.isUpdateProfileSuccess = true;
          this.isLoadingProfile = false;
          this.updateProfileError = '';
          this.isLoading = false;
          this.userData.username = response.username; // Actualizar username en userData
          this.userData.email = response.email; // Actualizar email en userData
          this.userProfileService.setUserData(this.userData); // Guardar userData actualizada
        },
        (error) => {
          this.updateProfileError = 'Error al actualizar el perfil de usuario';
          this.isLoading = false;
        }
      );
  }

  onChangePassword(): void {
    this.isLoading = true;
    this.isLoadingPassword = true;
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
    this.authService.deleteAccount().subscribe(
      () => {
        this.closeDeleteAccountModal();
        this.authService.logout(); // Cerrar sesión del usuario
        this.localStorage.clear(); // Limpiar la localStorage
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error('Error al eliminar la cuenta:', error);
        // Puedes mostrar un mensaje de error al usuario si es necesario
      }
    );
  }
}