import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {User} from "../../models/user";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonInput, IonButton, IonItem, IonLabel]
})
export class RegisterPage {

  userData: User = {
    name: '',
    lastname: '',
    profile_image: ''
  };

  email: string = '';
  password: string = '';

  userService: UserService = inject(UserService);

  constructor() {}

  onSubmit(form: any) {
    if (form.valid) {
      this.userService.register(this.email, this.password);
      this.userService.saveUserData(this.userData);
    } else {
      console.log('Formulario inválido');
    }
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.userData.profile_image = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

}
