import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonAvatar,
  IonContent,
  IonHeader,
  IonInfiniteScroll, IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {Pokemon} from "../../models/pokemon";
import { PokemonService } from 'src/app/services/pokemon.service';
import {InfiniteScrollCustomEvent} from "@ionic/angular";

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonInfiniteScroll, IonInfiniteScrollContent, IonAvatar]
})
export class HomePage implements OnInit {

  pokemon: Pokemon | null = null;
  pokemons: Pokemon[] = [];
  pokemonService: PokemonService = inject(PokemonService);

  limit: number = 20;
  lastName: string | null = null;
  loading: boolean = false;
  disableInfiniteScroll = false;

  ngOnInit() {
    this.loadFirstPokemons();
  }

  loadFirstPokemons() {
    this.loading = true;
    this.pokemonService.getFirstBatch(this.limit).subscribe(pokemons => {
      this.pokemons = pokemons;
      this.loading = false;
      if (pokemons.length > 0) {
        this.lastName = pokemons[pokemons.length - 1].nombre;
      }
      if (pokemons.length < this.limit) {
        this.disableInfiniteScroll = true;
      }
    });
  }

  onIonInfinite(event: InfiniteScrollCustomEvent) {
    if (this.loading || this.disableInfiniteScroll) return;

    this.loading = true;
    this.pokemonService.getNextBatch(this.limit, this.lastName!).subscribe(pokemons => {
      this.pokemons.push(...pokemons);
      this.loading = false;
      event.target.complete();

      if (pokemons.length > 0) {
        this.lastName = pokemons[pokemons.length - 1].nombre;
      }

      if (pokemons.length < this.limit) {
        this.disableInfiniteScroll = true;
        event.target.disabled = true;
      }
    });
  }



}
