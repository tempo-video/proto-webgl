import {
  firstValueFrom,
  Observable,
  forkJoin,
  defaultIfEmpty,
  from,
  map,
} from 'rxjs';
import { Texture, TextureLoader } from 'three';
import { LoadedTexture } from '../../assets/interfaces/Interfaces';

async function TexturesLoader(textureIds: string[]) {
  const loadedTextures$ = loadTextures(textureIds);
  const promise = firstValueFrom(loadedTextures$);
  return await promise;
}

function loadTextures(ids: string[]): Observable<LoadedTexture[]> {
  const observables = ids.map((id) => loadTexture(id));
  return forkJoin(observables).pipe(defaultIfEmpty([]));
}

function loadTexture(id: string): Observable<LoadedTexture> {
  return from(loadTextureImage(id)).pipe(
    map((texture) => ({
      id,
      texture,
    }))
  );
}

function loadTextureImage(textureInfos: string) {
  return new Promise<Texture>(function (resolve, reject) {
    const textureLoader = new TextureLoader();
    textureLoader.load(
      '../assets/images/' + textureInfos + '.png',
      function (texture) {
        resolve(texture);
      },
      undefined,
      function (err) {
        reject(err);
      }
    );
  });
}

export { TexturesLoader };
