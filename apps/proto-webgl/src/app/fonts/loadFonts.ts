import { defaultIfEmpty, forkJoin, from, map, Observable } from 'rxjs';
import { Font, FontLoader } from 'three';
import { LoadedFont } from '../../assets/interfaces/Interfaces';

function loadFonts(
  elements: { url: string; nameId: string }[]
): Observable<LoadedFont[]> {
  const observables$ = elements.map(({ url, nameId }) =>
    from(loadFontThree(url)).pipe(
      map((font) => ({
        url,
        name: nameId,
        font,
      }))
    )
  );
  return forkJoin(observables$).pipe(defaultIfEmpty([]));
}

function loadFontThree(url: string) {
  return new Promise<Font>(function (resolve, reject) {
    const fontLoader = new FontLoader();
    fontLoader.load(
      url,
      function (font) {
        resolve(font);
      },
      undefined,
      function (err) {
        reject(err);
      }
    );
  });
}

export { loadFonts };
