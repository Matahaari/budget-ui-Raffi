import { Component, inject, Input } from '@angular/core';
import { addMonths, set } from 'date-fns';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonMenuButton,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ModalController,
  ViewDidEnter
} from '@ionic/angular/standalone';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { add, alertCircleOutline, arrowBack, arrowForward, pricetag, search, swapVertical } from 'ionicons/icons';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Category } from '../../../shared/domain';
import CategoryModalComponent from '../../../category/component/category-modal/category-modal.component';
import ExpenseModalComponent from '../../component/expense-modal/expense-modal.component';
import { CategoryService } from '../../../category/service/category.service';
import { ToastService } from '../../../shared/service/toast.service';
import { ExpenseService } from '../../service/expense.service';
import { Expense, ExpenseCriteria, SortOption } from '../../../shared/domain';
import { debounce, finalize, interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,

    // Ionic
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonProgressBar,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonList,
    IonItemGroup,
    IonItemDivider,
    IonLabel,
    IonSkeletonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonFooter,
    IonButton
  ]
})
export default class ExpenseListComponent implements ViewDidEnter {
  // DI
  private readonly modalCtrl = inject(ModalController);
  private readonly categoryService = inject(CategoryService);
  private readonly toastService = inject(ToastService);
  private readonly ExpenseService = inject(ExpenseService);
  private searchFormSubscription?: Subscription;
  private readonly formBuilder = inject(NonNullableFormBuilder);
  readonly initialSort = 'name,asc';
  readonly searchForm = this.formBuilder.group({ name: [''], sort: [this.initialSort] });
  date = set(new Date(), { date: 1 });
  categories: Category[] = [];
  expenses: Expense[] = [];

  lastPageReached = false;
  loading = false;
  searchCriteria: ExpenseCriteria = { page: 0, size: 25, sort: this.initialSort };

  constructor() {
    // Add all used Ionic icons
    addIcons({ swapVertical, pricetag, search, alertCircleOutline, add, arrowBack, arrowForward });
  }

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number);
  };

  //Funktion um Modal anzuzeigen. Aufruf durch + Button
  async openexpenseModal(category?: Category): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: { category: category ?? {} }
    });
    modal.present();
    /*const { role } = await modal.onWillDismiss();
    if (role === 'refresh') this.reloadCategories();*/
  }

  ionViewDidEnter(): void {
    this.loadAllCategories();
    this.loadExpenses();
    this.searchFormSubscription = this.searchForm.valueChanges
      .pipe(debounce(searchParams => interval(searchParams.name?.length ? 400 : 0)))
      .subscribe(searchParams => {
        this.searchCriteria = { ...this.searchCriteria, ...searchParams, yearMonth: '' };
        this.loadExpenses();
      });
  }

  private loadAllCategories(): void {
    this.categoryService.getAllCategories({ sort: 'name,asc' }).subscribe({
      next: categories => (this.categories = categories),
      error: error => this.toastService.displayErrorToast('Could not load categories', error)
    });
  }

  async openModal(category?: Category): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CategoryModalComponent,
      componentProps: { category: category ?? {} }
    });
    modal.present();
    const { role } = await modal.onWillDismiss();
    // if (role === 'refresh') this.reloadCategories();
  }

  private loadExpenses(next?: () => void): void {
    if (!this.searchCriteria.name) delete this.searchCriteria.name;
    this.loading = true;
    this.ExpenseService.getAllExpenses(this.searchCriteria)
      .pipe(
        finalize(() => {
          this.loading = false;
          if (next) next();
        })
      )
      .subscribe({
        next: expense => {
          if (this.searchCriteria.page === 0 || !this.expenses) this.expenses = [];
          this.expenses.push(...expense.values());
          // this.lastPageReached = expense.sort();
        },
        error: error => this.toastService.displayWarningToast('Could not load expenses', error)
      });
  }
}
