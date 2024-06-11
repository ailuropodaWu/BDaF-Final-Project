import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChipsModule } from 'primeng/chips';
import { FormsModule } from '@angular/forms';
import { StepsModule } from 'primeng/steps';
import { MenuItem, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChipsModule, FormsModule, StepsModule, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [MessageService]
})
export class AppComponent {
  title = 'ethF2E';
  value: any;

  items: MenuItem[] | undefined;

  ngOnInit() {
    this.items = [
      {
        label: 'Prompt',
        routerLink: 'prompt'
      },
      {
        label: 'Transfer',
        routerLink: 'transfer'
      },
      {
        label: 'Result',
        routerLink: 'result'
      }
    ];
  }
}
