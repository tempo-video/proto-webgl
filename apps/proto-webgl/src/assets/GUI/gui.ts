import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { element } from '../Interfaces/Interfaces';
import {
  BloomPassComp,
  FilmPassComp,
  GlitchPassComp,
  FantomePassComp,
  GrainPassComp,
} from '../../app/effects/EffectsLybrairie';
import { fromEvent, of, map } from 'rxjs';

function ChooseTransition() {
  let textures: string[] = [];

  for (let i = 1; i < 20; i++) {
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
  console.log(htmlElements, document.getElementById('gui'));
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
  console.log(Htmlelement, document.getElementById('guiElem'));
  document.getElementById('guiElem')!.innerHTML = Htmlelement;
}

let Effects = [
    { name: 'BloomPassComp', effect: BloomPassComp, visibility: false },
    { name: 'FilmPassComp', effect: FilmPassComp, visibility: false },
    { name: 'GlitchPassComp', effect: GlitchPassComp, visibility: false },
    { name: 'FantomePassComp', effect: FantomePassComp, visibility: false },
    { name: 'GrainPassComp', effect: GrainPassComp, visibility: false },
];

function ChooseEffects(composer: EffectComposer) {
  let HtmlElement: string = '<ul>';
  for (let i = 0; i < Effects.length; i++) {
    HtmlElement +=
      '<li><p id="' + Effects[i].name + '">' + Effects[i].name + '</p></li>';
  }
  HtmlElement += '</ul>';
  document.getElementById('guiEffects')!.innerHTML = HtmlElement;

  fromEvent(document.getElementById('guiEffects')!, 'click').subscribe((event) => addEffects(composer,(<HTMLParagraphElement>event.target).id))
}

function addEffects(composer: EffectComposer, id: string){
    const effects = of(Effects);

    effects
        .pipe(map((x) => x.filter((y) => y.name === id)))
        .subscribe((elements) => elements.map((element) => {if(!element.visibility){composer.addPass(element.effect); element.visibility = true}else{composer.removePass(element.effect); element.visibility = false}}))
}

export { ChooseElement, ChooseTransition, ChooseEffects };
