import {inject, Injectable} from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  User,
  UserCredential
} from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { User as appUser } from '../models/user';
import {addDoc, collection, Firestore} from "@angular/fire/firestore";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  auth: Auth = inject(Auth);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  firestore: Firestore = inject(Firestore);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  async register(email: string, password: string): Promise<UserCredential> {
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }

  saveUserData(user: appUser) {
    const userRef = collection(this.firestore, 'users');
    return addDoc(userRef, user);
  }

  getCurrentUserUID(): string | null {
    return this.currentUserSubject.value?.uid ?? null;
  }

  async login(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }
}
