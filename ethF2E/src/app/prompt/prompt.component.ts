import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChipsModule } from 'primeng/chips';
import { PromptService } from '../service/prompt.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-prompt',
  standalone: true,
  imports: [FormsModule, ButtonModule, ChipsModule, ReactiveFormsModule],
  templateUrl: './prompt.component.html',
  styleUrl: './prompt.component.scss',
  providers: [PromptService],
})
export class PromptComponent {
  loading: boolean = false;

  form: FormGroup = this.fb.group({
    prompt: ['', [Validators.required]],
  });

  constructor(
    private messageService: MessageService,
    private fb: FormBuilder,
    private router: Router,
    private promptService: PromptService,
  ) {}

  submit() {
    this.loading = true;

    this.promptService.postData(this.form.value).subscribe({
      next: (res) => {
        this.loading = false;
        console.log(res);

        this.router.navigate(['/transfer', res]).then();
      },
      error: (err) => {
        this.loading = false;
        console.log(err);

        this.messageService.add({
          severity: 'error',
          detail: 'Network Error',
        });
      },
    });
  }
}
