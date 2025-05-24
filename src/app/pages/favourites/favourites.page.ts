import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActionSheetController,
  IonAvatar,
  IonButton,
  IonContent,
  IonHeader,
  IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {FooterComponent} from "../../components/footer/footer.component";
import {Pokemon} from "../../models/pokemon";
import {PokemonService} from "../../services/pokemon.service";
import {DatabaseService} from "../../services/database.service";
import {InfiniteScrollCustomEvent} from "@ionic/angular";
import {Router} from "@angular/router";

@Component({
  selector: 'app-favourites',
  templateUrl: './favourites.page.html',
  styleUrls: ['./favourites.page.scss'],
  standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FooterComponent, IonAvatar, IonButton, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList]
})
export class FavouritesPage implements OnInit {
  pokemons: Pokemon[] = [];
  favorites: string[] = [];
  pokemonService: PokemonService = inject(PokemonService);
  databaseService: DatabaseService = inject(DatabaseService);
  router: Router = inject(Router);

  constructor(private actionSheetController: ActionSheetController) {}

  async ngOnInit() {

    this.databaseService.favoritesChanged$.subscribe(() => {
      this.loadFavorites();
    });

  }

  async loadFavorites() {
    this.favorites = await this.databaseService.getFavorites();
    this.pokemons = [];

    for (const id of this.favorites) {

      if (this.pokemons.find(p => p.id === id)) continue;

      this.pokemonService.getPokemonById(id).subscribe(pokemon => {
        this.pokemons.push(pokemon);
      });
    }
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
          console.log(`${pokemon.nombre} added to favorites`);
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
