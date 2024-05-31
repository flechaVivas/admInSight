import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-upload-modal',
  templateUrl: './upload-modal.component.html',
})
export class UploadModalComponent {
  @Output() uploadFile = new EventEmitter<File>();
  @Output() cancel = new EventEmitter();

  title: string = 'Upload File';
  selectedFile: File | null = null;

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onConfirm() {
    if (this.selectedFile) {
      this.uploadFile.emit(this.selectedFile);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}