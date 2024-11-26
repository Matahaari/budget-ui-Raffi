import { Component, inject, Input } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ModalController
} from '@ionic/angular/standalone';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, calendar, cash, close, pricetag, save, text, trash } from 'ionicons/icons';
import CategoryModalComponent from '../../../category/component/category-modal/category-modal.component';
import { CategoryService } from '../../../category/service/category.service';
import { LoadingIndicatorService } from '../../../shared/service/loading-indicator.service';
import { ToastService } from '../../../shared/service/toast.service';
import { formatISO, parseISO } from 'date-fns';
import { Category, Expense, ExpenseUpsertDto } from '../../../shared/domain';
import { finalize, from, groupBy, mergeMap, toArray } from 'rxjs';
import { ExpenseService } from '../../service/expense.service';
import { RefresherCustomEvent } from '@ionic/angular';
import { formatPeriod } from '../../../shared/period';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,

    // Ionic
    IonList,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonChip,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonNote,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonFab,
    IonFabButton,
    IonSkeletonText,
    IonRadioGroup
  ]
})
export default class ExpenseModalComponent {
  // DI
  private readonly modalCtrl = inject(ModalController);
  private readonly categoryService = inject(CategoryService);
  private readonly ExpenseService = inject(ExpenseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly loadingIndicatorService = inject(LoadingIndicatorService);
  private readonly toastService = inject(ToastService);
  @Input() category: Category = {} as Category;
  categories: Category[] = [];

  readonly expenseForm = this.formBuilder.group({
    amount: [0, [Validators.min(0.1), Validators.required]],
    categoryId: [this.category.id!],
    date: [formatISO(new Date()), Validators.required],
    id: [null! as string], // hidden
    name: ['', [Validators.required, Validators.maxLength(40)]]
  });

  constructor() {
    // Add all used Ionic icons
    addIcons({ close, save, text, pricetag, add, cash, calendar, trash });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save(): void {
    this.loadingIndicatorService.showLoadingIndicator({ message: 'Saving expense' }).subscribe(loadingIndicator => {
      const expense = {
        ...this.expenseForm.value,
        id: this.expenseForm.value.id,
        categoryId: this.expenseForm.value.categoryId,
        name: this.expenseForm.value.name,
        amount: this.expenseForm.value.amount,
        date: formatISO(parseISO(this.expenseForm.value.date!), { representation: 'date' })
      } as ExpenseUpsertDto;
      this.ExpenseService.upsertExpense(expense)
        .pipe(finalize(() => loadingIndicator.dismiss()))
        .subscribe({
          next: () => {
            this.toastService.displaySuccessToast('expense saved');
            this.modalCtrl.dismiss(null, 'refresh');
          },
          error: error => this.toastService.displayWarningToast('Could not save expense', error)
        });
    });
  }

  delete(): void {
    this.modalCtrl.dismiss(null, 'delete');
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({ component: CategoryModalComponent });
    categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();
    console.log('role', role);
  }

  ionViewDidEnter(): void {
    this.loadAllCategories();
  }

  private loadAllCategories(): void {
    this.categoryService.getAllCategories({ sort: 'name,asc' }).subscribe({
      next: categories => (this.categories = categories),
      error: error => this.toastService.displayErrorToast('Could not load categories', error)
    });
  }

  async opencatModal(category?: Category): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CategoryModalComponent,
      componentProps: { category: category ?? {} }
    });
    modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'refresh') this.loadAllCategories();
  }
}
