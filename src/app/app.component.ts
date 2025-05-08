import { Component } from '@angular/core';
import {IonApp, IonFooter, IonRouterOutlet} from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonFooter],
})
export class AppComponent {
  constructor() {}
}
