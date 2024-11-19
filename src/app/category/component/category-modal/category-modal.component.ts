import { Component, inject, ViewChild } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar,
  ModalController,
  ViewDidEnter
} from '@ionic/angular/standalone';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { close, save, text, trash } from 'ionicons/icons';
import { LoadingIndicatorService } from '../../../shared/service/loading-indicator.service';
import { CategoryService } from '../../service/category.service';
import { ToastService } from '../../../shared/service/toast.service';
import { CategoryUpsertDto } from '../../../shared/domain';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-category-modal',
  templateUrl: './category-modal.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,

    // Ionic
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonFab,
    IonFabButton
  ]
})
export default class CategoryModalComponent implements ViewDidEnter {
  // DI
  private readonly modalCtrl = inject(ModalController);
  private readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly loadingIndicatorService = inject(LoadingIndicatorService);
  private readonly toastService = inject(ToastService);
  @ViewChild('nameInput') nameInput?: IonInput;
  readonly categoryForm = this.formBuilder.group({
    id: [null! as string], // hidden
    name: ['', [Validators.required, Validators.maxLength(40)]]
  });

  constructor() {
    // Add all used Ionic icons
    addIcons({ close, save, text, trash });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.loadingIndicatorService.showLoadingIndicator({ message: 'Saving category' }).subscribe(loadingIndicator => {
      const category = this.categoryForm.value as CategoryUpsertDto;
      this.categoryService
        .upsertCategory(category)
        .pipe(finalize(() => loadingIndicator.dismiss()))
        .subscribe({
          next: () => {
            this.toastService.displaySuccessToast('Category saved');
            this.modalCtrl.dismiss(null, 'refresh');
          },
          error: error => this.toastService.displayWarningToast('Could not save category', error)
        });
    });
  }

  ionViewDidEnter(): void {
    this.nameInput?.setFocus();
  }

  delete(): void {
    this.modalCtrl.dismiss(null, 'delete');
  }
}
