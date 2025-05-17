import { Component, OnInit } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonIcon, IonTab,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [
    IonTabs,
    IonHeader,
    IonToolbar,
    IonContent,
    IonTitle,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonTab
  ]
})
export class FooterComponent {

  constructor() {
    /**
     * Any icons you want to use in your application
     * can be registered in app.component.ts and then
     * referenced by name anywhere in your application.
     */
  }

}
