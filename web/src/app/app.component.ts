import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './shared/layout/sidebar.component';
import { UserAdminModalComponent } from './shared/admin/users-modal.component';

@Component({
  standalone: true,
  imports: [RouterModule, SidebarComponent, UserAdminModalComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  sidebarOpen = false;
  sidebarCollapsed = false;
  userAdminOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  onSidebarCollapsedChange(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  openUserAdmin(): void {
    this.userAdminOpen = true;
  }

  closeUserAdmin(): void {
    this.userAdminOpen = false;
  }
}
