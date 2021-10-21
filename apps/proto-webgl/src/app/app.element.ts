import './app.element.scss';
import {
  TextureLoader,
  Raycaster,
  Scene,
  Color,
  Texture,
  Vector2,
  OrthographicCamera,
  Mesh,
  DoubleSide,
  MeshBasicMaterial,
  PlaneGeometry,
  VideoTexture,
  MathUtils,
  CircleGeometry,
  WebGLRenderer,
  TextGeometry,
  FontLoader,
  Font,
  Renderer,
  Camera,
  Event,
  Object3D,
  Clock,
  PlaneBufferGeometry,
  PerspectiveCamera,
  ShaderMaterial,
  Shader,
  Material,
  RGBFormat,
  LinearFilter,
  WebGLRenderTarget,
  ImageLoader,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterImagePass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import * as data from '../assets/editor-state.json';
import {
  fromEvent,
  Observable,
  generate,
  from,
  forkJoin,
  firstValueFrom,
  zip,
  of,
} from 'rxjs';
import { map, defaultIfEmpty } from 'rxjs';
import { DigitalGlitch } from '../assets/Shaders/VideosShaderMaterials';
import addSubtitles from './subtitles/addSubtitles';
import {
  LoadedFont,
  LoadedTexture,
  shapeInfos,
  element,
} from '../assets/Interfaces/Interfaces';
import { transitionShader } from '../assets/TransitionTest/TransitionTest';
import { ChooseTransition, ChooseElement, ChooseEffects } from '../assets/GUI/gui';

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const title = 'proto-webgl';
    this.innerHTML = `<div id="videos" ></div>
      <div id="frame">
      <input id="ts" type="string" /><input type="button" id="button" ><p id="ts-result"></p>
      <div id="container"><div id="guiAll" ><div id="gui" ></div><div id="guiFlex" ><div id="guiElem" ></div><div id="guiEffects" ></div></div></div><div id="renderer" ></div></div></div>`;
  }
}
customElements.define('proto-webgl-root', AppElement);

const dataEditor = data.editor;

let videoWidth: number, videoHeight: number;

let camera: Camera, scene: Scene, renderer: WebGLRenderer;

let allFontsLoaded: Array<LoadedFont> = [],
  allTextureLoaded: Array<LoadedTexture> = [];

let clock = new Clock();
let clockTransition: Clock;
let composer: EffectComposer;
let grainEffect: ShaderPass;

////////////////////////////////////////////////////////
////////////////Initialisation de THREE/////////////////
////////////////////////////////////////////////////////

async function init() {
  (videoWidth = dataEditor.videoWidth), (videoHeight = dataEditor.videoHeight);

  scene = new Scene();
  scene.background = new Color(0xfff0ff);

  camera = new OrthographicCamera(
    videoWidth / -2,
    videoWidth / 2,
    videoHeight / -2,
    videoHeight / 2,
    0,
    1000
  );

  camera.position.z = 20;
  scene.add(camera);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(videoWidth * 0.4, videoHeight * 0.4);
  document.getElementById('renderer')!.appendChild(renderer.domElement);

  const PlaneTransition = new Mesh(
    new PlaneGeometry(videoWidth, videoHeight),
    transitionShader
  );

  PlaneTransition.position.set(0, 0, 0);
  PlaneTransition.rotation.set(Math.PI, 0, 0);

  scene.add(PlaneTransition);

  Composer();

  //load all the assets
  console.log('loading');
  await getAllVideos();
  await TexturesLoader();
  await FontsLoader();
  console.log(allFontsLoaded);
  console.log('loaded');

  //Add them in threejs
  addAllVideosThree();
  getAllElements();
  TextLoader('salutttt', 'regular');
  //TextLoader('coucou', 'regular');
  //TextLoader('bonjour', 'headline');
  //addSubtitles('In literary theory, a text is any object that can be "read", whether this object is a work of literature, a street sign, an arrangement of buildings on a city block, or styles of clothing. It is a coherent set of signs that transmits some kind of informative message.', allFontsLoaded[1].font, scene, 1, 1920 * 0.6, 1080 / 2);
  playVideo('dd6a50d4-3f30-4007-a953-d9748b266462', 0);
  playVideo('ede08c9d-2483-454d-8478-478c32cfc7d5', 0);
  ChooseElement(Elements);
  animation();


  const input = <HTMLInputElement>document.getElementById('ts');

  fromEvent(input, 'change').subscribe(() =>
    addSubtitles(
      input.value,
      allFontsLoaded[1].font,
      scene,
      0.7,
      1920 * 0.6,
      1080 / 2
    )
  );

  fromEvent(document.getElementById('guiElem')!, 'click').subscribe((event) => addElement((<HTMLParagraphElement>event.target).id));

  fromEvent(document.getElementById('gui')!, 'click').subscribe((event) =>
    TransitionGoF(
      'ede08c9d-2483-454d-8478-478c32cfc7d5',
      (<HTMLImageElement>event.target!).id
    )
  );
}

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

function CreateScene() {
  (videoWidth = dataEditor.videoWidth), (videoHeight = dataEditor.videoHeight);

  const newScene = new Scene();
  newScene.background = new Color(0xfff0ff);

  const newCamera = new OrthographicCamera(
    videoWidth / -2,
    videoWidth / 2,
    videoHeight / -2,
    videoHeight / 2,
    0,
    1000
  );

  newCamera.position.z = 20;
  newScene.add(newCamera);

  return newScene;
}

function Composer() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  ChooseEffects(composer);
}

////////////////////////////////////////////////////////////////
///////////////////////Fonctions en plus////////////////////////
////////////////////////////////////////////////////////////////

let PlaneGeom: PlaneBufferGeometry[] = [];

let PlaneMat: ShaderMaterial;

function animation() {
  requestAnimationFrame(animation);
  let deltaTime = clock.getElapsedTime();

  //PlaneMat.uniforms.uTime.value = clock.getElapsedTime();

  //grainEffect.uniforms['amount'].value = clock.getElapsedTime();

  composer.render(deltaTime);
}

function TransitionGoF(VideoId: string, index: string) {
  if (index.includes('transition')) {
    const transitionTexture = new TextureLoader().load(
      '../assets/TransitionTest/Assets/' + index + '.png'
    );

    transitionShader.uniforms.tMixTexture.value = transitionTexture;

    let videoElement = <HTMLVideoElement>document.getElementById(VideoId);
    videoElement.play();
    videoElement.currentTime = 0;

    transitionShader.uniforms.tDiffuse1.value = new VideoTexture(videoElement);

    clockTransition = new Clock();

    TransitionAnimation();
  }
}

let TransitionSpeed: number = 1;

function TransitionAnimation() {
  let deltaTime: number = clockTransition.getElapsedTime();

  transitionShader.uniforms.mixRatio.value = deltaTime * TransitionSpeed;

  if (deltaTime < 1 / TransitionSpeed) {
    requestAnimationFrame(TransitionAnimation);
  }
}

////////////////////////////////////////////////////////////////////
//////////////////////////// ELEMENTS //////////////////////////////
////////////////////////////////////////////////////////////////////

//////////////////////////Get Elements//////////////////////////////

async function getAllElements() {
  const allElements = of(dataEditor.elementModels);

  allElements
    .pipe(map((x) => x.filter((y) => y.categoryId === 'brand')))
    .subscribe((elements) => elements.map((element) => addBrandThree(element)));

  allElements
    .pipe(map((x) => x.filter((y) => y.categoryId === 'shape')))
    .subscribe((elements) => elements.map((element) => addShapeThree(element)));
}

////////////////////////////Add Shape to THREE///////////////////////////

function addShapeThree(shapeInfos: shapeInfos) {
  switch (shapeInfos.id) {
    case 'square':
      let square = new Mesh(
        new PlaneGeometry(shapeInfos.width, shapeInfos.height),
        new MeshBasicMaterial({
          color: 0xff0f00,
          side: DoubleSide,
        })
      );
      TransformShape(square, shapeInfos);
      break;
    case 'circle':
      let circle = new Mesh(
        new CircleGeometry(shapeInfos.width, 32),
        new MeshBasicMaterial({
          color: 0xfffff0,
          side: DoubleSide,
        })
      );
      TransformShape(circle, shapeInfos);
      break;
  }
}

const Elements: element[] = [];

function TransformShape(shapeElement: Mesh, element: shapeInfos) {
  shapeElement.position.set(
    element.transform.translation.x,
    element.transform.translation.y,
    element.depth
  );
  shapeElement.rotation.set(
    element.transform.rotation.x,
    element.transform.rotation.y,
    element.transform.rotation.z
  );
  shapeElement.scale.set(
    element.transform.scale.x,
    element.transform.scale.y,
    element.transform.scale.z
  );
  Elements.push({
    element: shapeElement,
    name: element.name,
    visibility: false,
  });
}

//////////////Load Image//////////////////

function loadTextureImage(textureInfos: string) {
  return new Promise<Texture>(function (resolve, reject) {
    let textureLoader = new TextureLoader();
    textureLoader.load(
      '../assets/' + textureInfos + '.png',
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

async function TexturesLoader() {
  const textureIds = dataEditor.elementModels
    .filter((element) => element.categoryId === 'brand')
    .map((element) => element.id);
  const loadedTextures$ = loadTextures(textureIds);
  const promise = firstValueFrom(loadedTextures$);
  allTextureLoaded = await promise;
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

///////////////////////Add Images to THREE////////////////////

function addBrandThree(brandInfos: shapeInfos) {
  const loadedtexture = allTextureLoaded.find(
    (element) => element.id === brandInfos.id
  );
  const texture = loadedtexture!.texture;
  let plane = new Mesh(
    new PlaneGeometry(brandInfos.width, brandInfos.height),
    new MeshBasicMaterial({
      color: new Color(),
      map: texture,
      side: DoubleSide,
    })
  );
  TransformShape(plane, brandInfos);
}

///////////////////////////////////////////////
/////////////////// VIDEO /////////////////////
///////////////////////////////////////////////

function videoLoading(video: HTMLVideoElement) {
  return new Promise<void>((resolve, _reject) => {
    console.log('loading video n°' + video.src);
    fromEvent(video, 'loadeddata').subscribe(() => resolve());
  });
}

async function getAllVideos() {
  const IdsVideo = dataEditor.tracks[0].itemIds;

  IdsVideo.map((id) => createVideoHtmlElement(id));
}

async function createVideoHtmlElement(id: string) {
  const video = document.createElement('video');
  video.id = id;
  const videoSrc = dataEditor.trackItems.find((element) => element.id == id);
  video.src = '../assets/' + videoSrc!.videoId + '.mp4';
  document.getElementById('videos')!.appendChild(video);

  await videoLoading(video);
  console.log('function ', video.readyState);
}

const Scenes: Scene[] = [];

function addAllVideosThree() {
  console.log('lancer addAllVideosThree');
  for (let i = 0; i < dataEditor.tracks[0].itemIds.length; i++) {
    let videos = dataEditor.tracks[0].itemIds[i];

    let videoElement = <HTMLVideoElement>document.getElementById(videos);

    let newVideoWidth = videoWidth,
      newVideoHeight = videoHeight;

    let newTextureVideo = new VideoTexture(videoElement);

    transitionShader.uniforms.tDiffuse2.value = newTextureVideo;

    let videoData = dataEditor.trackItems.find(
      (element) => element.id === videos
    );

    let newGeometry = new PlaneGeometry(
      newVideoWidth * videoData!.transform.scale.x,
      newVideoHeight * videoData!.transform.scale.y,
      10,
      10
    );
    PlaneGeom.push(newGeometry);

    const newMaterialRGBShift = new ShaderMaterial(DigitalGlitch);
    PlaneMat = newMaterialRGBShift;

    const newTextureDispl = new ImageLoader().load(
      'assets/TransitionTest/Assets/transition19.png'
    );

    newMaterialRGBShift.uniforms.tDiffuse.value = newTextureVideo;
    newMaterialRGBShift.uniforms.tDisp.value = newTextureDispl;

    const newMaterial = new MeshBasicMaterial({
      map: newTextureVideo,
      side: DoubleSide,
    });

    let newMesh = new Mesh(newGeometry, newMaterial);
    newMesh.name = videos;
    newMesh.rotation.set(
      Math.PI + videoData!.transform.rotation.x,
      videoData!.transform.rotation.y,
      0
    );
    newMesh.position.set(
      videoData!.transform.translation.x,
      videoData!.transform.translation.y,
      0
    );

    const newScene = CreateScene();
    Scenes.push(newScene);

    newScene.add(newMesh);

    console.log('Scenes', Scenes);
  }
}

function pauseVideo(id: string) {
  if (id) {
    const videoObject = scene.getObjectByName(id);
    videoObject!.visible = false;

    const videoElement = <HTMLVideoElement>document.getElementById(id);
    videoElement.pause();
  }
}

function playVideoPromise(video: HTMLVideoElement) {
  return new Promise((resolve) => {
    resolve(video.play());
  });
}

async function playVideo(id: string, start: number) {
  let videoElement = <HTMLVideoElement>document.getElementById(id);
  console.log(videoElement);
  let videoObject = scene.getObjectByName(id);

  await playVideoPromise(videoElement);

  videoElement.currentTime = start;
}

///////////////////////////////////////////////////////////////
//////////////////////////// TEXT /////////////////////////////
///////////////////////////////////////////////////////////////

///////////////////////Load Font///////////////////////////////

function loadFontThree(url: string) {
  return new Promise<Font>(function (resolve, reject) {
    let fontLoader = new FontLoader();
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

async function FontsLoader() {
  const fontsToLoad = dataEditor.textModels;

  const promise = firstValueFrom(loadFonts(fontsToLoad));

  allFontsLoaded = await promise;
}

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

///////////////////////Add Text to THREE/////////////////////////

function TextLoader(textString: string, type: string) {
  var fontIndex = allFontsLoaded.findIndex((element) => {
    return element.name === type;
  });
  console.log(allFontsLoaded[fontIndex]);
  var textGeo = new TextGeometry(textString, {
    size: 100,
    height: 100,
    curveSegments: 6,
    font: allFontsLoaded[fontIndex].font,
  });
  var color = new Color();
  color.setRGB(255, 255, 255);
  var textMaterial = new MeshBasicMaterial({
    color: color,
    side: DoubleSide,
  });
  let text = new Mesh(textGeo, textMaterial);
  text.name = type; // Changer sur le id du texte
  text.position.set(-200, 0, 8);
  text.rotation.set(Math.PI, 0, 0);
  scene.add(text);
}

/*
.subscribe(command => {
  switch (vid){
    case 'PlayVideo' :
      break;
  }})
*/

init();
ChooseTransition();