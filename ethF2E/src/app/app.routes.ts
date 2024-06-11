import { Routes } from '@angular/router';
import { PromptComponent } from './prompt/prompt.component';
import { ResultComponent } from './result/result.component';
import { TransferComponent } from './transfer/transfer.component';

export const routes: Routes = [
  { path: '', redirectTo: 'prompt', pathMatch: 'full' },
  { path: 'prompt', component: PromptComponent},
  { path: 'transfer', component: TransferComponent},
  { path: 'result', component: ResultComponent},
  { path: '**', redirectTo: 'prompt' },
];
