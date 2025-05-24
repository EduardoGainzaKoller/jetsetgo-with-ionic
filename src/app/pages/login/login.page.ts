import { Component } from '@angular/core';
import {FormsModule, NgForm} from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import {UserService} from "../../services/user.service";
import {IonButton, IonContent, IonHeader, IonInput, IonItem, IonTitle, IonToolbar} from "@ionic/angular/standalone";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    IonItem,
    IonContent,
    IonInput,
    IonToolbar,
    IonTitle,
    IonHeader,
    FormsModule,
    IonButton
  ]
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private userService: UserService,
    private navCtrl: NavController,
    private toastController: ToastController
  ) {}

  async onLogin(form: NgForm) {
    if (form.invalid) return;

    try {
      await this.userService.login(this.email, this.password);
      this.showToast('Inicio de sesión exitoso');
      this.navCtrl.navigateRoot('/home');
    } catch (error: any) {
      this.showToast('Error al iniciar sesión: ' + error.message);
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
  }
}
