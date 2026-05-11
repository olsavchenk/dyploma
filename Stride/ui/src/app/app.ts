import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationPermissionCardComponent } from './shared/components/notification-permission-card/notification-permission-card.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationPermissionCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ui');
}
