import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FieldsetModule } from 'primeng/fieldset';
import { PanelModule } from 'primeng/panel';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TransferService } from '../service/transfer.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    ButtonModule,
    FormsModule,
    InputTextModule,
    FieldsetModule,
    PanelModule,
    ReactiveFormsModule
  ],
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.scss'
})
export class TransferComponent {
  loading: boolean = false;

  form: FormGroup = this.fb.group({
    networkFrom: ['', [Validators.required]],
    addressFrom: ['', [Validators.required]],
    networkTo: ['', [Validators.required]],
    addressTo: ['', [Validators.required]],
    amount: ['', [Validators.required]],
  });

  constructor(
    private messageService: MessageService,
    private fb: FormBuilder,
    private route:ActivatedRoute,
    private router: Router,
    private transferService: TransferService,
  ) {
  }

  ngOnInit() {
    console.log(this.route.snapshot.params)
    let data = this.route.snapshot.params;
    this.form.get('networkFrom')?.setValue(data[0]);
    this.form.get('addressFrom')?.setValue(data[1]);
    this.form.get('networkTo')?.setValue(data[2]);
    this.form.get('addressTo')?.setValue(data[3]);
    this.form.get('amount')?.setValue(data[4]);
  }

  submit() {
    this.loading = true;

    this.transferService.postData(this.form.value).subscribe({
      next: (res) => {
        this.loading = false;
        console.log(res);

        this.router.navigate(['/result', res]).then();
      },
      error: (err) => {
        this.loading = false;
        console.log(err);

        this.router.navigate(['/result', err]).then();
      }
    });
  }
}
