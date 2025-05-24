import { Component, Input } from '@angular/core';
import {
  CommonModule
} from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  ModalController
} from '@ionic/angular/standalone';
import { Pokemon } from '../../models/pokemon';

@Component({
  selector: 'app-detail-pop-up',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel
  ],
  templateUrl: './detail-pop-up.component.html',
  styleUrls: ['./detail-pop-up.component.scss']
})
export class DetailPopUpComponent {
  @Input() pokemon!: Pokemon;

  constructor(private modalCtrl: ModalController) {}

  closeModal() {
    this.modalCtrl.dismiss();
  }
}
