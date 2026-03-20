import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, ButtonModule, AvatarModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  authService = inject(AuthService);

  // Returns the first letter of the username for the avatar circle
  get avatarLabel(): string {
    const username = this.authService.currentUsername();
    return username ? username.charAt(0).toUpperCase() : '?';
  }

  logout() {
    this.authService.logout();
  }
}
