import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActionSheetController,
  IonAvatar, IonButton,
  IonContent, IonFooter, IonHeader, IonIcon,
  IonInfiniteScroll, IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList, IonTab, IonTabBar, IonTabButton, IonTabs, IonTitle, IonToolbar,
} from '@ionic/angular/standalone';
import {Pokemon} from "../../models/pokemon";
import { PokemonService } from 'src/app/services/pokemon.service';
import {InfiniteScrollCustomEvent} from "@ionic/angular";
import {FooterComponent} from "../../components/footer/footer.component";
import {DatabaseService} from "../../services/database.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonInfiniteScroll, IonInfiniteScrollContent, IonAvatar, IonHeader, IonTitle, IonToolbar, IonButton, FooterComponent, IonFooter]
})
export class HomePage implements OnInit {

  pokemons: Pokemon[] = [];
  pokemonService: PokemonService = inject(PokemonService);

  limit: number = 20;
  lastName: string | null = null;
  loading: boolean = false;
  disableInfiniteScroll = false;

  databaseService: DatabaseService = inject(DatabaseService);

  constructor(private actionSheetController: ActionSheetController) {}

  ngOnInit() {
    this.loadFirstPokemons();
    console.log(this.pokemons);
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

  async presentActionSheet({pokemon}: { pokemon: Pokemon }) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Options',
      cssClass: 'my-custom-class',
      buttons: [{
        text: 'Favorite',
        icon: 'heart',
        handler: async () => {
          await this.databaseService.addFavorite(pokemon.id);
          console.log(`${pokemon.id} added to favorites`);
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      }, {
        text: 'Remove',
        icon: 'X',
        handler: async () => {
          await this.databaseService.removeFavorite(pokemon.id);
          console.log(`${pokemon.nombre} remove from favorites`);
        }
      }]
    });
    await actionSheet.present();

    const { role, data } = await actionSheet.onDidDismiss();
    console.log('onDidDismiss resolved with role and data', role, data);
  }



}
