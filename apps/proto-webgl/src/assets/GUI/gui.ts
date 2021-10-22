import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { element, effect } from '../Interfaces/Interfaces';
import {
  BloomPassComp,
  FilmPassComp,
  GlitchPassComp,
  FantomePassComp,
  GrainPassComp,
  AdaptivePassComp,
  BokehPassComp,
} from '../../app/effects/EffectsLybrairie';
import { fromEvent, of, map } from 'rxjs';
import { scene, camera } from '../../app/app.element';

function ChooseTransition() {
  let textures: string[] = [];

  for (let i = 1; i < 21; i++) {
    textures.push('transition' + i);
  }

  let htmlElements: string = '<ul>';
  for (let i = 0; i < textures.length; i++) {
    htmlElements +=
      '<li><img src="assets/TransitionTest/Assets/' +
      textures[i] +
      '.png" id="' +
      textures[i] +
      '" /></li>';
  }
  htmlElements += '</ul>';
  document.getElementById('gui')!.innerHTML = htmlElements;
}

function ChooseElement(Elements: element[]) {
  console.log(Elements);
  let Htmlelement: string = '<ul>';
  for (let i = 0; i < Elements.length; i++) {
    Htmlelement +=
      '<li><p id="' + Elements[i].name + '">' + Elements[i].name + '</p></li>';
  }
  Htmlelement += '</ul>';
  document.getElementById('guiElem')!.innerHTML = Htmlelement;
}

let BokehParams = {
  focus: 1.0,
  aspect: 1.0,
  aperture: 0.025,
  maxblur: 1.0,
  width: 1920,
  height: 1080,
};

let Effects: effect[] = [];

function EffectsCreate() {
  Effects = [
    { name: 'BloomPassComp', effect: BloomPassComp, visibility: false },
    { name: 'FilmPassComp', effect: FilmPassComp, visibility: false },
    { name: 'GlitchPassComp', effect: GlitchPassComp, visibility: false },
    { name: 'FantomePassComp', effect: FantomePassComp, visibility: false },
    { name: 'GrainPassComp', effect: GrainPassComp, visibility: false },
    { name: 'AdaptivePassComp', effect: AdaptivePassComp, visibility: false },
    {
      name: 'BokehPassComp',
      effect: BokehPassComp(scene, camera, BokehParams),
      visibility: false,
    },
  ];
}

function ChooseEffects(composer: EffectComposer) {
  let HtmlElement: string = '<ul>';
  for (let i = 0; i < Effects.length; i++) {
    HtmlElement +=
      '<li><p id="' + Effects[i].name + '">' + Effects[i].name + '</p></li>';
  }
  HtmlElement += '</ul>';
  document.getElementById('guiEffects')!.innerHTML = HtmlElement;

  fromEvent(document.getElementById('guiEffects')!, 'click').subscribe(
    (event) => addEffects(composer, (<HTMLParagraphElement>event.target).id)
  );
}

function composerAnimation(composer: EffectComposer, deltaTime: number) {

  if (Effects[4].visibility) {
    Effects[4].effect.uniforms['amount'].value = deltaTime;
  }

  composer.render(deltaTime);
}

function addEffects(composer: EffectComposer, id: string) {
  const effects = of(Effects);

  effects
    .pipe(map((x) => x.filter((y) => y.name === id)))
    .subscribe((elements) =>
      elements.map((element) => {
        if (!element.visibility) {
          composer.addPass(element.effect);
          element.visibility = true;
        } else {
          composer.removePass(element.effect);
          element.visibility = false;
        }
      })
    );
}

export {
  ChooseElement,
  ChooseTransition,
  ChooseEffects,
  EffectsCreate,
  composerAnimation,
};
