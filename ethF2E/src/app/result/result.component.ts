import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [
    CardModule
  ],
  templateUrl: './result.component.html',
  styleUrl: './result.component.scss'
})
export class ResultComponent {
  isSuccessful: boolean = false;
  txId = '';

  constructor(
    private route:ActivatedRoute,
  ) {
  }

  ngOnInit() {
    console.log(this.route.snapshot.params)
    let data = this.route.snapshot.params;

    this.isSuccessful = data[0] === '1n';
    this.txId = data[1];
  }

}
