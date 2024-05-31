import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-add-user-group-modal',
  templateUrl: './add-user-group-modal.component.html',
})
export class AddUserGroupModalComponent {

  @Input() title: string = '';
  @Input() type: 'user' | 'group' = 'user';
  @Output() confirm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter();

  form: any = {};

  onConfirm() {
    this.confirm.emit(this.form);
    this.resetForm();
  }

  onCancel() {
    this.cancel.emit();
    this.resetForm();
  }

  resetForm() {
    this.form = {};
  }
}
