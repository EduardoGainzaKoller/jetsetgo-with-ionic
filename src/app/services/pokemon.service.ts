import {inject, Injectable} from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore, limit,
  orderBy,
  query, startAfter,
  updateDoc
} from "@angular/fire/firestore";
import {Pokemon} from "../models/pokemon";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PokemonService {

  firestore: Firestore = inject(Firestore);

  constructor() { }

  addPokemon(pokemon: Pokemon) {
    const pokemonRef = collection(this.firestore, 'pokemones');
    return addDoc(pokemonRef, pokemon);
  }

  getAllPokemons(): Observable<Pokemon[]> {
    const pokemonRef = collection(this.firestore, 'pokemones');
    return collectionData(pokemonRef, {idField: 'id'}) as Observable<Pokemon[]>;
  }

  updatePokemon(id: string, pokemon: Partial<Pokemon>) {
    const pokemonRef = doc(this.firestore, `pokemones/${id}`);
    return updateDoc(pokemonRef, pokemon);
  }

  deletePokemon(id: string) {
    const pokemonRef = doc(this.firestore, `pokemones/${id}`);
    return deleteDoc(pokemonRef);
  }

  getFirstBatch(limitCount: number): Observable<Pokemon[]> {
    const ref = collection(this.firestore, 'pokemones');
    const q = query(ref, orderBy('nombre'), limit(limitCount));
    return collectionData(q, { idField: 'id' }) as Observable<Pokemon[]>;
  }


  getNextBatch(limitCount: number, lastName: string): Observable<Pokemon[]> {
    const ref = collection(this.firestore, 'pokemones');
    const q = query(ref, orderBy('nombre'), startAfter(lastName), limit(limitCount));
    return collectionData(q, { idField: 'id' }) as Observable<Pokemon[]>;
  }
}
