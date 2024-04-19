import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-install-package-modal',
  templateUrl: './install-package-modal.component.html',
  styleUrls: ['./install-package-modal.component.css']
})
export class InstallPackageModalComponent {
  packageName: string = '';

  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter();

  onConfirm() {
    this.confirm.emit(this.packageName);
    this.packageName = '';
  }

  onCancel() {
    this.cancel.emit();
  }
}