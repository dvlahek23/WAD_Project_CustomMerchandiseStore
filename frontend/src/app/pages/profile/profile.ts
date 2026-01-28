import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/user';
import { AuthService } from '../../core/auth';
import { filter, take } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  designerRequest: any = null;
  designerRequests: any[] = [];
  logs: any[] = [];
  users: any[] = [];
  showUsers = false;
  loadingUsers = false;
  loadingLogs = false;
  roles = [
    { id: 4, name: 'Administrator' },
    { id: 3, name: 'Management' },
    { id: 1, name: 'Control' },
    { id: 2, name: 'Regular' }
  ];
  userTypes = [
    { id: 1, name: 'Customer' },
    { id: 2, name: 'Designer' }
  ];
  pendingRoleChanges: Map<number, number> = new Map(); // userId -> new roleId
  pendingUserType: Map<number, number> = new Map(); // userId -> selected userTypeId (1=customer, 2=designer)
  loading = false;
  message = '';
  error = '';

  // Pagination for activity log
  logsPerPage = 10;
  currentLogPage = 1;

  // Delete user confirmation
  userToDelete: any = null;

  // Change user type confirmation
  userTypeChange: { user: any, newTypeId: number, newTypeName: string } | null = null;

  constructor(
    public userService: UserService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // If user is already loaded, load data immediately
    if (this.userService.user) {
      this.loadRoleSpecificData();
    } else {
      // Otherwise wait for user to be loaded
      this.userService.user$.pipe(
        filter(user => user !== null),
        take(1)
      ).subscribe(() => {
        this.loadRoleSpecificData();
        this.cdr.detectChanges();
      });
    }
  }

  loadRoleSpecificData() {
    // Regular user who is a customer but not designer: load their designer request status
    if (this.userService.isRegular && this.userService.isCustomer && !this.userService.isDesigner) {
      this.authService.getMyDesignerRequest().subscribe({
        next: (request) => {
          this.designerRequest = request;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }

    // Management: load pending designer requests
    if (this.userService.isManagement) {
      this.authService.getDesignerRequests().subscribe({
        next: (requests) => {
          this.designerRequests = requests;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }

    // Admin: load logs and users automatically
    if (this.userService.isAdmin) {
      this.loadLogs();
      this.loadUsers();
    }
  }

  loadLogs() {
    this.loadingLogs = true;
    this.authService.getLogs().subscribe({
      next: (logs) => {
        this.logs = logs;
        this.currentLogPage = 1;
        this.loadingLogs = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingLogs = false;
        this.cdr.detectChanges();
      }
    });
  }

  refreshLogs() {
    this.loadLogs();
  }

  get paginatedLogs(): any[] {
    const start = (this.currentLogPage - 1) * this.logsPerPage;
    return this.logs.slice(start, start + this.logsPerPage);
  }

  get totalLogPages(): number {
    return Math.ceil(this.logs.length / this.logsPerPage);
  }

  goToLogPage(page: number) {
    if (page >= 1 && page <= this.totalLogPages) {
      this.currentLogPage = page;
      this.cdr.detectChanges();
    }
  }

  loadUsers() {
    this.loadingUsers = true;
    this.showUsers = true;
    this.error = '';
    this.pendingRoleChanges.clear();
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loadingUsers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingUsers = false;
        this.error = err.error?.error || 'Failed to load users';
        this.cdr.detectChanges();
      }
    });
  }

  onRoleSelect(userId: number, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newRoleId = parseInt(select.value);
    const user = this.users.find(u => u.user_id === userId);

    if (user && user.role_id !== newRoleId) {
      this.pendingRoleChanges.set(userId, newRoleId);
      // If changing to Regular, default to Customer
      if (newRoleId === 2) {
        this.pendingUserType.set(userId, 1); // Default to Customer
      } else {
        this.pendingUserType.delete(userId);
      }
    } else {
      this.pendingRoleChanges.delete(userId);
      this.pendingUserType.delete(userId);
    }
    this.cdr.detectChanges();
  }

  onUserTypeSelectForRole(userId: number, event: Event) {
    const select = event.target as HTMLSelectElement;
    const typeId = parseInt(select.value);
    this.pendingUserType.set(userId, typeId);
    this.cdr.detectChanges();
  }

  hasPendingChange(userId: number): boolean {
    return this.pendingRoleChanges.has(userId);
  }

  cancelRoleChange(userId: number) {
    this.pendingRoleChanges.delete(userId);
    this.pendingUserType.delete(userId);
    this.cdr.detectChanges();
  }

  confirmRoleChange(userId: number) {
    const roleId = this.pendingRoleChanges.get(userId);
    if (roleId === undefined) return;

    this.error = '';
    const userType = this.pendingUserType.get(userId);

    // If changing to Regular and no type selected, show error
    if (roleId === 2 && !userType) {
      this.error = 'Please select an account type';
      return;
    }

    this.authService.updateUserRole(userId, roleId).subscribe({
      next: () => {
        // If role is Regular, set the user type
        if (roleId === 2 && userType) {
          this.authService.addUserType(userId, userType).subscribe({
            next: () => {
              this.pendingRoleChanges.delete(userId);
              this.pendingUserType.delete(userId);
              this.loadUsers();
              this.loadLogs();
            },
            error: () => {
              this.pendingRoleChanges.delete(userId);
              this.pendingUserType.delete(userId);
              this.loadUsers();
              this.loadLogs();
            }
          });
        } else {
          this.pendingRoleChanges.delete(userId);
          this.pendingUserType.delete(userId);
          this.loadUsers();
          this.loadLogs();
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to update role';
        this.pendingRoleChanges.delete(userId);
        this.pendingUserType.delete(userId);
        this.loadUsers();
      }
    });
  }

  // Prompt to change user type (for existing regular users)
  promptChangeUserType(userId: number, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newTypeId = parseInt(select.value);
    const user = this.users.find(u => u.user_id === userId);

    if (!user) return;

    // Get current type id
    const currentType = user.userTypes?.[0]?.toLowerCase();
    const currentTypeId = currentType === 'customer' ? 1 : currentType === 'designer' ? 2 : 0;

    if (currentTypeId === newTypeId) return;

    const newTypeName = newTypeId === 1 ? 'Customer' : 'Designer';
    this.userTypeChange = { user, newTypeId, newTypeName };
    this.cdr.detectChanges();
  }

  cancelUserTypeChange() {
    this.userTypeChange = null;
    this.loadUsers(); // Reload to reset dropdown
  }

  confirmUserTypeChange() {
    if (!this.userTypeChange) return;

    const { user, newTypeId } = this.userTypeChange;
    const userId = user.user_id;

    // Get current type id
    const currentType = user.userTypes?.[0]?.toLowerCase();
    const currentTypeId = currentType === 'customer' ? 1 : currentType === 'designer' ? 2 : 0;

    this.error = '';

    // Remove old type first, then add new type
    if (currentTypeId > 0) {
      this.authService.removeUserType(userId, currentTypeId).subscribe({
        next: () => {
          this.authService.addUserType(userId, newTypeId).subscribe({
            next: () => {
              this.userTypeChange = null;
              this.loadUsers();
              this.loadLogs();
            },
            error: (err) => {
              this.error = err.error?.error || 'Failed to update account type';
              this.userTypeChange = null;
              this.loadUsers();
            }
          });
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to update account type';
          this.userTypeChange = null;
          this.loadUsers();
        }
      });
    } else {
      // No existing type, just add
      this.authService.addUserType(userId, newTypeId).subscribe({
        next: () => {
          this.userTypeChange = null;
          this.loadUsers();
          this.loadLogs();
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to update account type';
          this.userTypeChange = null;
          this.loadUsers();
        }
      });
    }
  }

  promptDeleteUser(user: any) {
    this.userToDelete = user;
    this.cdr.detectChanges();
  }

  cancelDeleteUser() {
    this.userToDelete = null;
    this.cdr.detectChanges();
  }

  confirmDeleteUser() {
    if (!this.userToDelete) return;

    const userId = this.userToDelete.user_id;
    this.error = '';

    this.authService.deleteUser(userId).subscribe({
      next: () => {
        this.userToDelete = null;
        this.loadUsers();
        this.loadLogs();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to delete user';
        this.userToDelete = null;
        this.cdr.detectChanges();
      }
    });
  }

  get roleDisplay(): string {
    const role = this.userService.user?.role;
    if (!role) return '';

    const roleNames: Record<string, string> = {
      'administrator': 'Administrator',
      'management': 'Store Manager',
      'control': 'Control',
      'regular': 'Regular User'
    };
    return roleNames[role.toLowerCase()] || role;
  }

  get userTypesDisplay(): string {
    const types = this.userService.user?.userTypes || [];
    if (types.length === 0) return '';

    return types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
  }

  requestDesigner() {
    this.loading = true;
    this.message = '';
    this.error = '';

    this.authService.requestDesigner().subscribe({
      next: (res) => {
        this.message = res.message;
        this.loading = false;
        this.loadRoleSpecificData();
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to submit request';
        this.loading = false;
      }
    });
  }

  approveRequest(requestId: number) {
    this.authService.approveDesignerRequest(requestId).subscribe({
      next: () => {
        this.designerRequests = this.designerRequests.filter(r => r.request_id !== requestId);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to approve request';
      }
    });
  }

  denyRequest(requestId: number) {
    this.authService.denyDesignerRequest(requestId).subscribe({
      next: () => {
        this.designerRequests = this.designerRequests.filter(r => r.request_id !== requestId);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to deny request';
      }
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.userService.clearUser();
        this.router.navigateByUrl('/');
      }
    });
  }

  exportLogsToPdf() {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Activity Log Report', 14, 22);

    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // Prepare table data
    const tableData = this.logs.map(log => {
      const date = new Date(log.created_at).toLocaleString();
      const action = log.action || '-';
      let details = '';

      if (log.target_username && (log.old_value || log.new_value)) {
        details = `${log.target_username}: ${log.old_value || '-'} → ${log.new_value || '-'}`;
      } else if (log.target_username) {
        details = log.target_username;
      } else if (log.old_value || log.new_value) {
        details = `${log.old_value || '-'} → ${log.new_value || '-'}`;
      } else {
        details = log.entity_type || '-';
      }

      return [date, log.actor_username, action, details];
    });

    // Create table
    autoTable(doc, {
      startY: 38,
      head: [['Date', 'User', 'Action', 'Details']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [90, 58, 49] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });

    // Save PDF
    doc.save('activity-log.pdf');
  }
}
