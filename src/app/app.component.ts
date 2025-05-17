import { Component } from '@angular/core';
import {IonApp, IonFooter, IonRouterOutlet} from '@ionic/angular/standalone';
import {FooterComponent} from "./components/footer/footer.component";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonFooter, FooterComponent],
})
export class AppComponent {
  constructor() {}
}
