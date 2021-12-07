import './app.element.scss';
import {
  TextureLoader,
  Scene,
  Color,
  OrthographicCamera,
  Mesh,
  DoubleSide,
  MeshBasicMaterial,
  PlaneGeometry,
  VideoTexture,
  CircleGeometry,
  WebGLRenderer,
  Camera,
  Clock,
  Object3D,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import * as data from '../assets/editor-state.json';
import { fromEvent, firstValueFrom, of } from 'rxjs';
import { map } from 'rxjs';
import addSubtitles from './subtitles/addSubtitles';
import {
  LoadedFont,
  LoadedTexture,
  shapeInfos,
  element,
  sceneBuffer,
  Transform,
  dataInterface,
} from '../assets/interfaces/Interfaces';
import { transitionShader } from './transitions/transitions';
import {
  ChooseTransition,
  ChooseElement,
  ChooseEffects,
  EffectsCreate,
  composerAnimation,
} from '../assets/gui/gui';
import { SceneBuffer } from './scenes/scenes';

import { loadFonts } from './fonts/loadFonts';
import { TextLoader } from './fonts/addTextThree';

import { TexturesLoader } from './images/loadImages';
import { addBrandThree } from './images/addImages';
import { addShapeThree } from './shapes/addShapeThree';

import { getAllVideos } from './videos/loadAllVideos';
import { playVideo } from './videos/controls';

export { scene, camera };

const dataEditor = data.editor;

let videoWidth: number, videoHeight: number;

let camera: Camera, scene: Scene, renderer: WebGLRenderer;

const clock = new Clock();
let clockTransition: Clock;
let composer: EffectComposer;

let allFontsLoaded: Array<LoadedFont> = [];
let allTextureLoaded: Array<LoadedTexture> = [];
const Elements: element[] = [];
const Scenes: sceneBuffer[] = [];

let animations: any[] = [];

////////////////////////////////////////////////////////
////////////////Initialisation de THREE/////////////////
////////////////////////////////////////////////////////

async function init() {
  videoWidth = dataEditor.videoWidth;
  videoHeight = dataEditor.videoHeight;

  scene = new Scene();
  scene.background = new Color(0xfff0ff);

  camera = new OrthographicCamera(
    videoWidth / -2,
    videoWidth / 2,
    videoHeight / -2,
    videoHeight / 2,
    -200,
    200
  );

  scene.add(camera);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(videoWidth * 0.4, videoHeight * 0.4);
  document.getElementById('renderer')!.appendChild(renderer.domElement);

  const Quad = new Mesh(
    new PlaneGeometry(videoWidth, videoHeight),
    transitionShader
  );

  Quad.position.set(0, 0, -2);
  Quad.rotation.set(Math.PI, 0, Math.PI);

  scene.add(Quad);

  // -> load all the assets
  await getAllVideos(dataEditor.tracks[0].itemIds, dataEditor.trackItems);
  await loadAllTextures(dataEditor);
  await FontsLoader();

  // -> Add them in threejs
  addAllVideosThree();
  getAllElements();
  addTextThree('salutttt\ntoua', 'regular');
  addSubtitles(
    'In literary theory, a text is any object that can be "read", whether this object is a work of literature, a street sign, an arrangement of buildings on a city block, or styles of clothing. It is a coherent set of signs that transmits some kind of informative message.',
    allFontsLoaded[1].font,
    scene,
    0.7,
    1920 * 0.5,
    1080 / 2
  );
  playVideo('ede08c9d-2483-454d-8478-478c32cfc7d5', 0, Scenes);
  ChooseElement(Elements);
  ChooseTransition();

  // -> composer pour les effets globaux
  Composer();

  animation();

  ////////////////////////////////////////////////////////////////
  ///////////////////////// GUI Integration //////////////////////
  ////////////////////////////////////////////////////////////////

  // -> Ajoute des sous-titres
  const input = <HTMLInputElement>document.getElementById('ts');
  fromEvent(input, 'change').subscribe(() =>
    addSubtitles(
      input.value,
      allFontsLoaded[1].font,
      scene,
      0.7,
      1920 * 0.4,
      1080 / 2
    )
  );

  // -> Ajoute un élément
  fromEvent(document.getElementById('guiElem')!, 'click').subscribe((event) =>
    addElement((<HTMLParagraphElement>event.target).id)
  );

  // -> Call Transition
  fromEvent(document.getElementById('gui')!, 'click').subscribe((event) =>
    TransitionGoF(
      'dd6a50d4-3f30-4007-a953-d9748b266462',
      (<HTMLImageElement>event.target!).id
    )
  );
}

/////////////////////////////////////////////////////////////////
////////////////////////// Composer /////////////////////////////
/////////////////////////////////////////////////////////////////

function Composer() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  EffectsCreate();
  ChooseEffects(Scenes[1].composer);
}

////////////////////////////////////////////////////////////////
///////////////////////// Animations ///////////////////////////
////////////////////////////////////////////////////////////////

var onlyOnce = true;

function animation() {
  requestAnimationFrame(animation);
  const deltaTime = clock.getElapsedTime();

  if (scene.getObjectByName('Tempo') && onlyOnce) {
    var obj = scene.getObjectByName('Tempo');

    animations.push(obj);

    onlyOnceF(obj);

    onlyOnce = false;
  }

  let dt = clock.getDelta();
  animations.forEach((object) => {
    object.updateAnimation(deltaTime);
  });

  //Scenes[2].render();
  //Scenes[1].render();
  //Scenes[0].render();

  composerAnimation(composer, deltaTime);
}

function onlyOnceF(obj: any) {
  /*cadre.onClick = function (intersection) {
    if (this.animationStatus == 0) {
      this.animationStatus = 1;
    } else if (this.animationStatus == 2) {
      this.animationStatus = 3;
    }
  };*/

  console.log('onlyOnceSet');

  obj.animationStatus = 0;

  document.addEventListener('click', () => {
    console.log('eoh');
    if (obj.animationStatus == 0) {
      console.log('obj anim set to 1');
      obj.animationStatus = 1;
    } else if (obj.animationStatus == 2) {
      console.log('obj anim set to 3');
      obj.animationStatus = 3;
    }
  });

  obj.end = 200;
  obj.start = 0;
  obj.duration = 1000;
  obj.updateAnimation = function (dt: any) {
    let angle = (dt * (this.end - this.start)) / this.duration;
    switch (this.animationStatus) {
      case 1:
        this.position.y -= angle;
        //this.position.y = easeOutBack(map_range(this.position.y - angle, this.end, this.start, 0, 1));
        if (this.position.y < this.start) {
          this.position.y = this.start;
          this.animationStatus = 2;
        }
        break;
      case 3:
        this.position.y += angle;
        if (this.position.y > this.end) {
          this.position.y = this.end;
          this.animationStatus = 0;
        }
        break;
    }
  };
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

function map_range(value: any, low1: any, high1: any, low2: any, high2: any) {
  return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
}

////////////////////////////////////////////////////////////////
//////////////////////// Transitions ///////////////////////////
////////////////////////////////////////////////////////////////

function TransitionGoF(VideoId: string, index: string) {
  if (index.includes('transition')) {
    const transitionTexture = new TextureLoader().load(
      '../../assets/transitions/' + index + '.png'
    );

    transitionShader.uniforms.tMixTexture.value = transitionTexture;

    const videoElement = <HTMLVideoElement>document.getElementById(VideoId);
    videoElement.play();
    videoElement.currentTime = 0;

    const sceneVid = Scenes.find((element) => element.id === VideoId);

    transitionShader.uniforms.tDiffuse1.value = sceneVid?.fbo.texture;

    clockTransition = new Clock();

    TransitionAnimation();
  }
}

let TransitionSpeed = 1;

function TransitionAnimation() {
  const deltaTime: number = clockTransition.getElapsedTime();

  transitionShader.uniforms.mixRatio.value = deltaTime * TransitionSpeed;

  if (deltaTime < 1 / TransitionSpeed) {
    requestAnimationFrame(TransitionAnimation);
  }
}

////////////////////////////////////////////////////////////////////
//////////////////////////// ELEMENTS //////////////////////////////
////////////////////////////////////////////////////////////////////

function addElement(name: string) {
  const allElements = of(Elements);

  allElements
    .pipe(map((x) => x.filter((y) => y.name === name)))
    .subscribe((elements) => elements.map((element) => ShowElement(element)));
}

function ShowElement(elem: element) {
  if (!elem.visibility) {
    const elementThree = elem.element;
    elementThree.name = elem.name;
    scene.add(elementThree);
    elem.visibility = true;
  } else {
    scene.remove(elem.element);
    elem.visibility = false;
  }
}

////////////////////////// Get Elements //////////////////////////////

async function getAllElements() {
  const allElements = of(dataEditor.elementModels);

  allElements
    .pipe(map((x) => x.filter((y) => y.categoryId === 'brand')))
    .subscribe((elements) =>
      elements.map((element) =>
        Elements.push(addBrandThree(element, allTextureLoaded)!)
      )
    );

  allElements
    .pipe(map((x) => x.filter((y) => y.categoryId === 'shape')))
    .subscribe((elements) =>
      elements.map((element) => Elements.push(addShapeThree(element)!))
    );
}

async function loadAllTextures(data: dataInterface) {
  const textureIds = data.elementModels
    .filter((element) => element.categoryId === 'brand')
    .map((element) => element.id);

  allTextureLoaded = await TexturesLoader(textureIds);
}

//////////////////////////////////////////////////////////////
////////////////////////// VIDEO /////////////////////////////
//////////////////////////////////////////////////////////////

function addAllVideosThree() {
  for (let i = 0; i < dataEditor.tracks[0].itemIds.length; i++) {
    const videos = dataEditor.tracks[0].itemIds[i];

    const videoElement = <HTMLVideoElement>document.getElementById(videos);

    const videoData = dataEditor.trackItems.find(
      (element) => element.id === videos
    );

    const newMesh = new Mesh(
      new PlaneGeometry(
        videoWidth * videoData!.transform.scale.x,
        videoHeight * videoData!.transform.scale.y
      ),
      new MeshBasicMaterial({
        map: new VideoTexture(videoElement),
        side: DoubleSide,
      })
    );

    newMesh.name = videos;
    newMesh.rotation.set(
      videoData!.transform.rotation.x,
      videoData!.transform.rotation.y,
      0
    );
    newMesh.position.set(
      videoData!.transform.translation.x,
      videoData!.transform.translation.y,
      0
    );

    const newScene = SceneBuffer(renderer, videos);
    Scenes.push(newScene);

    newScene.scene.add(newMesh);
  }
}

///////////////////////////////////////////////////////////////
//////////////////////////// TEXT /////////////////////////////
///////////////////////////////////////////////////////////////

async function FontsLoader() {
  const fontsToLoad = dataEditor.textModels;

  const promise = firstValueFrom(loadFonts(fontsToLoad));

  allFontsLoaded = await promise;
}

function addTextThree(textString: string, type: string) {
  scene.add(TextLoader(textString, type, allFontsLoaded));
}

/////////////////////////////////////////////////////////////////

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    this.innerHTML = `<div id="videos" ></div>
      <div id="frame">
      <input id="ts" type="string" /><input type="button" id="button" ><p id="ts-result"></p>
      <div id="container"><div id="guiAll" ><div id="gui" ></div><div id="guiFlex" ><div id="guiElem" ></div><div id="guiEffects" ></div></div></div><div id="renderer" ></div></div></div>`;
  }
}
customElements.define('proto-webgl-root', AppElement);

init();
