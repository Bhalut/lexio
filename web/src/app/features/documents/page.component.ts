import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import {
  CaseAccessLevel,
  CaseHeader,
  CurrentUser,
  DocumentDelivery,
  UploadProgress,
} from '../../shared/services/api.service';
import { canUploadDocuments } from '../../shared/auth/permissions';
import { AuthStateService } from '../../shared/services/auth-state.service';
import { CaseHeaderComponent } from './components/case/header.component';
import { UploadModalComponent } from './components/upload/modal.component';
import {
  DocumentRowComponent,
  FlatDocument,
} from './components/document/row.component';
import { DocumentGridCardComponent } from './components/document/grid-card.component';
import { DocumentDetailDrawerComponent } from './components/document/detail-drawer.component';
import { CaseNotesPanelComponent } from './components/case/notes.component';
import { CaseActivityPanelComponent } from './components/case/activity.component';
import { CasePartiesPanelComponent } from './components/case/parties.component';
import { DeliveryCardComponent } from './components/delivery/card.component';
import {
  DocumentLibraryFilters,
  SortMode,
  filterDeliveries,
  filterDocuments,
  flattenDocuments,
  getFilteredSummary,
  getLatestDeliveryMeta,
  getLatestDeliveryTitle,
  getTotalSize,
  getTypeBreakdown,
  getUniqueDeliveryValues,
  hasActiveHistoryFilters,
  hasActiveLibraryFilters,
} from './workspace.presenter';
import {
  DocumentsPageFacade,
  getLoadErrorMessage,
  getUploadErrorMessage,
} from './page.facade';

type ViewMode = 'list' | 'grid';
type TabId = 'documents' | 'notes' | 'activity' | 'parties';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [
    CaseHeaderComponent,
    UploadModalComponent,
    DocumentRowComponent,
    DocumentGridCardComponent,
    DocumentDetailDrawerComponent,
    CaseNotesPanelComponent,
    CaseActivityPanelComponent,
    CasePartiesPanelComponent,
    DeliveryCardComponent,
  ],
  templateUrl: './page.component.html',
  styleUrl: './page.component.css',
})
export class DocumentsPageComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'documents', label: 'Documentos', count: 0 },
    { id: 'notes', label: 'Notas' },
    { id: 'activity', label: 'Actividad' },
    { id: 'parties', label: 'Partes' },
  ];

  selectedTab: TabId = 'documents';
  caseId = '';

  caseData: CaseHeader | null = null;
  currentUser: CurrentUser | null = null;
  deliveries: DocumentDelivery[] = [];
  allDocuments: FlatDocument[] = [];
  filteredDocuments: FlatDocument[] = [];

  loading = true;
  error: string | null = null;
  showUploadModal = false;
  showDeliveryHistory = false;
  uploading = false;
  uploadProgress = 0;
  uploadError = '';

  searchQuery = '';
  selectedCategory = 'all';
  selectedPhase = 'all';
  historyCategory = 'all';
  historyPhase = 'all';
  sortMode: SortMode = 'newest';
  viewMode: ViewMode = 'list';

  selectedDoc: FlatDocument | null = null;
  selectedIndex = -1;
  relatedDocs: FlatDocument[] = [];

  toast: { message: string; type: 'success' | 'error' } | null = null;

  private uploadSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly authState = inject(AuthStateService);
  private readonly facade = inject(DocumentsPageFacade);

  ngOnInit(): void {
    this.caseId = this.route.snapshot.paramMap.get('caseId') ?? '';
    if (!this.caseId) {
      this.error = 'No se proporcionó un ID de expediente válido.';
      this.loading = false;
      return;
    }

    this.currentUser = this.authState.currentUser;
    this.authSubscription = this.authState.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
      },
    });
    this.loadData();
  }

  ngOnDestroy(): void {
    this.uploadSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isEditing = target
      ? ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      : false;

    if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      this.selectedTab = 'documents';
      setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
      return;
    }

    if (
      event.key.toLowerCase() === 'u' &&
      !isEditing &&
      this.selectedTab === 'documents'
    ) {
      event.preventDefault();
      this.openUploadModal();
      return;
    }

    if (event.key === 'Escape') {
      if (this.showUploadModal) {
        this.closeUploadModal();
      } else if (this.selectedDoc) {
        this.closeDrawer();
      } else if (this.hasActiveFilters()) {
        this.clearLibraryFilters();
      }
    }
  }

  loadData(): void {
    if (!this.caseId) {
      this.loading = false;
      this.error = 'No se proporcionó un ID de expediente válido.';
      return;
    }

    this.loading = true;
    this.error = null;

    this.facade.loadWorkspace(this.caseId).subscribe({
      next: ({ caseData, deliveries, documentCount }) => {
        this.caseData = caseData;
        this.deliveries = deliveries;
        this.tabs[0] = {
          ...this.tabs[0],
          count: documentCount,
        };
        this.flattenDocuments();
        this.loading = false;
      },
      error: (error) => this.handleLoadError(error),
    });
  }

  canUpload(): boolean {
    const accessLevel = this.getCurrentCaseAccessLevel();
    return (
      Boolean(this.currentUser) &&
      canUploadDocuments(this.currentUser, accessLevel) &&
      !this.loading &&
      this.selectedTab === 'documents'
    );
  }

  openUploadModal(): void {
    if (!this.currentUser) {
      this.showToast(
        'Selecciona una sesión activa antes de registrar documentos.',
        'error',
      );
      return;
    }

    if (
      !canUploadDocuments(this.currentUser, this.getCurrentCaseAccessLevel())
    ) {
      this.showToast(
        'Tu acceso actual permite consulta del expediente, pero no registrar nuevas entregas en este asunto.',
        'error',
      );
      return;
    }

    if (this.selectedTab !== 'documents') {
      return;
    }

    this.showUploadModal = true;
  }

  onUpload(formData: FormData): void {
    if (this.uploading) {
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;
    this.uploadError = '';
    this.uploadSubscription?.unsubscribe();

    this.uploadSubscription = this.facade
      .uploadDelivery(this.caseId, formData)
      .subscribe({
        next: (event: UploadProgress) => this.handleUploadEvent(event),
        error: (error) => this.handleUploadError(error),
      });
  }

  cancelUpload(): void {
    this.uploadSubscription?.unsubscribe();
    this.uploadSubscription = null;
    this.uploading = false;
    this.uploadProgress = 0;
    this.uploadError = 'La subida fue cancelada por el usuario.';
  }

  closeUploadModal(): void {
    if (this.uploading) {
      return;
    }

    this.showUploadModal = false;
    this.uploadError = '';
    this.uploadProgress = 0;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  setCategoryFilter(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  setPhaseFilter(phase: string): void {
    this.selectedPhase = phase;
    this.applyFilters();
  }

  clearLibraryFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedPhase = 'all';
    this.applyFilters();
  }

  setHistoryCategoryFilter(category: string): void {
    this.historyCategory = category;
  }

  setHistoryPhaseFilter(phase: string): void {
    this.historyPhase = phase;
  }

  clearHistoryFilters(): void {
    this.historyCategory = 'all';
    this.historyPhase = 'all';
  }

  setSortMode(mode: SortMode): void {
    this.sortMode = mode;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredDocuments = filterDocuments(
      this.allDocuments,
      this.getLibraryFilters(),
    );
  }

  selectTab(tabId: TabId): void {
    this.selectedTab = tabId;
  }

  openDrawer(document: FlatDocument): void {
    this.selectedDoc = document;
    this.selectedIndex = this.filteredDocuments.indexOf(document);
    this.relatedDocs = this.allDocuments.filter(
      (candidate) =>
        candidate.deliveryId === document.deliveryId &&
        candidate.id !== document.id,
    );
  }

  closeDrawer(): void {
    this.selectedDoc = null;
    this.selectedIndex = -1;
    this.relatedDocs = [];
  }

  navigateDrawer(direction: 'prev' | 'next'): void {
    const nextIndex =
      direction === 'prev' ? this.selectedIndex - 1 : this.selectedIndex + 1;
    if (nextIndex >= 0 && nextIndex < this.filteredDocuments.length) {
      this.openDrawer(this.filteredDocuments[nextIndex]);
    }
  }

  getTypeBreakdown(): string {
    return getTypeBreakdown(this.filteredDocuments);
  }

  getFilteredSummary(): string {
    return getFilteredSummary(
      this.filteredDocuments,
      this.allDocuments,
      this.getLibraryFilters(),
    );
  }

  getTotalSize(): string {
    return getTotalSize(this.filteredDocuments);
  }

  getLatestDeliveryTitle(): string {
    return getLatestDeliveryTitle(this.deliveries);
  }

  getLatestDeliveryMeta(): string {
    return getLatestDeliveryMeta(this.deliveries);
  }

  hasActiveFilters(): boolean {
    return hasActiveLibraryFilters(this.getLibraryFilters());
  }

  hasActiveHistoryFilters(): boolean {
    return hasActiveHistoryFilters(this.historyCategory, this.historyPhase);
  }

  get categoryOptions(): string[] {
    return getUniqueDeliveryValues(this.deliveries, 'category');
  }

  get phaseOptions(): string[] {
    return getUniqueDeliveryValues(this.deliveries, 'relatedPhase');
  }

  get filteredDeliveries(): DocumentDelivery[] {
    return filterDeliveries(
      this.deliveries,
      this.historyCategory,
      this.historyPhase,
    );
  }

  dismissToast(): void {
    this.toast = null;
  }

  private getCurrentCaseAccessLevel(): CaseAccessLevel | null {
    return this.caseData?.currentUserAccessLevel ?? null;
  }

  private flattenDocuments(): void {
    this.allDocuments = flattenDocuments(this.deliveries);
    this.applyFilters();
  }

  private handleLoadError(error: unknown): void {
    this.loading = false;

    if (this.getErrorStatus(error) === 401) {
      void this.authState.handleExpiredSession(
        'Tu sesión expiró. Inicia sesión nuevamente para consultar este expediente.',
      );
      this.error =
        'Tu sesión expiró. Inicia sesión nuevamente para consultar el expediente.';
      return;
    }

    this.error = getLoadErrorMessage(error);
  }

  private handleUploadEvent(event: UploadProgress): void {
    if (event.type === 'progress') {
      this.uploadProgress = event.percent;
      return;
    }

    if (event.type === 'complete' && event.body) {
      this.deliveries = [event.body, ...this.deliveries];
      this.tabs[0] = {
        ...this.tabs[0],
        count: (this.tabs[0].count || 0) + event.body.documents.length,
      };
      this.flattenDocuments();
      this.uploading = false;
      this.uploadProgress = 0;
      this.showUploadModal = false;
      this.showToast('Entrega registrada correctamente.', 'success');
    }
  }

  private handleUploadError(error: unknown): void {
    this.uploading = false;
    this.uploadProgress = 0;

    if (this.getErrorStatus(error) === 401) {
      this.showUploadModal = false;
      this.uploadError = '';
      void this.authState.handleExpiredSession(
        'Tu sesión expiró. Inicia sesión nuevamente para registrar documentos.',
      );
      this.showToast('Tu sesión expiró. Inicia sesión nuevamente.', 'error');
      return;
    }

    this.uploadError = getUploadErrorMessage(error);
    this.showToast(
      error instanceof HttpErrorResponse && error.status === 403
        ? this.uploadError
        : 'No fue posible guardar la entrega.',
      'error',
    );
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => this.dismissToast(), 3500);
  }

  private getErrorStatus(error: unknown): number | null {
    if (error instanceof HttpErrorResponse) {
      return error.status;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status?: unknown }).status === 'number'
    ) {
      return (error as { status: number }).status;
    }

    return null;
  }

  private getLibraryFilters(): DocumentLibraryFilters {
    return {
      searchQuery: this.searchQuery,
      selectedCategory: this.selectedCategory,
      selectedPhase: this.selectedPhase,
      sortMode: this.sortMode,
    };
  }
}
