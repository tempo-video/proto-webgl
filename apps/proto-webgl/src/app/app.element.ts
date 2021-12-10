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
  Vector3,
  Box3,
  Vector,
  PlaneHelper,
  Plane,
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

import { localPlanes } from './fonts/addTextThree';

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

import * as TWEEN from '@tweenjs/tween.js';
import { posix } from 'path';

////////////////////////////////////////////////////////
////////////////Initialisation de THREE/////////////////
////////////////////////////////////////////////////////

async function init() {
  videoWidth = dataEditor.videoWidth;
  videoHeight = dataEditor.videoHeight;

  scene = new Scene();
  scene.background = new Color(0x0f00ff);

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
  renderer.localClippingEnabled = true;
  document.getElementById('renderer')!.appendChild(renderer.domElement);

  const Quad = new Mesh(
    new PlaneGeometry(videoWidth, videoHeight),
    transitionShader
  );

  Quad.position.set(0, 0, -2);
  Quad.rotation.set(Math.PI, 0, Math.PI);

  //scene.add(Quad);

  // -> load all the assets
  await getAllVideos(dataEditor.tracks[0].itemIds, dataEditor.trackItems);
  await loadAllTextures(dataEditor);
  await FontsLoader();

  // -> Add them in threejs
  addAllVideosThree();
  getAllElements();
  addTextThree('Bienvenue\nsur le site\nTEMPO', 'regular');
  /*addSubtitles(
    'In literary theory, a text is any object that can be "read", whether this object is a work of literature, a street sign, an arrangement of buildings on a city block, or styles of clothing. It is a coherent set of signs that transmits some kind of informative message.',
    allFontsLoaded[1].font,
    scene,
    0.7,
    1920 * 0.5,
    1080 / 2
  );*/
  //playVideo('ede08c9d-2483-454d-8478-478c32cfc7d5', 0, Scenes);
  ChooseElement(Elements);
  ChooseTransition();

  // -> composer pour les effets globaux
  Composer();

  animation(null);

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

function animation(time: any) {
  requestAnimationFrame(animation);
  const deltaTime = clock.getElapsedTime();

  if (scene.children[1] && onlyOnce) {
    var obj = {
      objects: scene.children[1],
    };

    animations.push(obj);

    onlyOnceF(obj);

    onlyOnce = false;
  }

  TWEEN.update(deltaTime);

  let dt = clock.getDelta();
  animations.forEach((object) => {
    object.updateAnimation(deltaTime, dt);
  });

  TWEEN.update(time);

  //Scenes[2].render();
  //Scenes[1].render();
  //Scenes[0].render();

  composerAnimation(composer, deltaTime);
}

function onlyOnceF(obj: any) {
  console.log('onlyOnceSet');

  obj.options = {
    animationStatus: 0,
    end: -150,
    start: 300,
    duration: 50,
    i: -10,
    oldAngle: 0,
    onlyOnce: true,
  };

  console.log('obj : ' + obj);

  document.addEventListener('click', () => {
    console.log('eoh');
    if (obj.options.animationStatus == 0) {
      console.log('obj anim set to 1');
      obj.options.animationStatus = 3;
    }
  });

  obj.objects.position.set(0,0,0);

  
  new Box3()
    .setFromObject(obj.objects)
    .getCenter(obj.objects.position)
    .multiplyScalar(-1);

  /*obj.objects.position.set(0,0,0);
  obj.objects.visibility = true;
  /*var mesh = obj.objects;
  var center = new Vector3();
  mesh.geometry.computeBoundingBox();
  mesh.geometry.boundingBox.getCenter(center);
  mesh.geometry.center();
  mesh.position.copy(center);*/

  obj.updateAnimation = function (dt: any, d: any) {
    switch (this.options.animationStatus) {
      case 2:
        if (this.options.onlyOnce) {
          let position: { x: number; y: number; z: number } = {
            x: 0,
            y: 0,
            z: 0,
          };
          new TWEEN.Tween(position)
            .to({ x: 0, y: -1200, z: 0 }, 1500)
            .easing(TWEEN.Easing.Back.InOut)
            .onUpdate(() => {
              this.objects.position.y = position.y;
            })
            .onComplete(() => {
              this.options.onlyOnce = true;
              this.options.animationStatus = 0;
            })
            .start();
          this.options.onlyOnce = false;
        }
        break;
      case 3:
        if (this.options.onlyOnce) {
          let scale: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 };
          console.log('scale : ' + scale);
          new TWEEN.Tween(scale)
            .to({ x: 1.8, y: 1.8, z: 1.8 }, 600)
            .easing(TWEEN.Easing.Elastic.Out)
            .onUpdate(() => {
              console.log('update scale y: ' + scale.y);
              this.objects.scale.set(scale.x, scale.y, scale.z);
            })
            .onComplete(() => {
              this.options.animationStatus = 0;
              this.options.onlyOnce = true;
            })
            .start();
          this.options.onlyOnce = false;
        }
        break;
      case 4:
        console.log('essai lancé case 4');
        if (this.options.onlyOnce) {
          console.log('case 4 start');
          let opacity: { o: number } = { o: 1 };
          new TWEEN.Tween(opacity)
            .to({ o: 0 }, 1000)
            .easing(TWEEN.Easing.Quartic.In)
            .onUpdate(() => {
              console.log('update opacity, o : ' + opacity.o);
              this.objects[1].material.opacity = opacity.o;
            })
            .onComplete(() => {
              this.options.onlyOnce = true;
              this.options.animationStatus = 0;
            })
            .start();
          this.options.onlyOnce = false;
        }
        break;
      case 5:
        if (this.options.onlyOnce) {
          let start = {
            positions: { x: 0, y: 400, z: 0 },
            opacity: 0,
            scale: { x: 1, y: 1, z: 1 },
          };
          let end = {
            positions: { x: 0, y: -180, z: 0 },
            opacity: 1,
            scale: { x: 1.2, y: 1.2, z: 1.2 },
          };
          for (let i = 0; i < this.objects.children.length; i++) {
            new TWEEN.Tween(start)
              .to(end, 600)
              .delay(50 * i)
              .easing(TWEEN.Easing.Cubic.InOut)
              .onStart(() => {
                this.objects.visible = true;
                let box = new Box3().setFromObject(this.objects.children[i]);
                let height = box.max.y - box.min.y;
                console.log(
                  'top plane : ' +
                    (-180 + height * i) +
                    'bottome plane : ' +
                    (-180 + height * (i + 1))
                );

                this.objects.children[i].children.forEach((element: any) => {
                  element.material.clippingPlanes = [
                    new Plane(new Vector3(0, 1, 0), 200 + height / 2 - 200 * i),
                    new Plane(
                      new Vector3(0, -1, 0),
                      -200 - height / 2 + 200 * (i + 1)
                    ),
                  ];
                });
              })
              .onUpdate(() => {
                this.objects.children[i].position.set(
                  start.positions.x,
                  start.positions.y + i * 200,
                  start.positions.z
                );
              })
              .start()
              .chain(
                new TWEEN.Tween(end)
                  .to(
                    {
                      positions: { x: -300, y: -180, z: 0 },
                      opacity: 1,
                      scale: { x: 1.8, y: 1.8, z: 1.8 },
                    },
                    500
                  )
                  .easing(TWEEN.Easing.Cubic.InOut)
                  .onStart(() => {
                    /*new TWEEN.Tween(end)
                      .to(
                        {
                          positions: { x: 0, y: -150, z: 0 },
                          opacity: 1,
                          scale: { x: 1.3, y: 1.3, z: 1.3 },
                        },
                        500
                      )
                      .easing(TWEEN.Easing.Cubic.InOut)
                      .onUpdate(() => {
                        if (i == 2) {
                          this.objects[i].position.set(
                            end.positions.x,
                            end.positions.y + (i * 200),
                            end.positions.z
                          );
                        }
                      })
                      .start();*/
                    new TWEEN.Tween(end)
                      .to(
                        {
                          positions: { x: 0, y: -1250, z: 0 },
                          opacity: 1,
                          scale: { x: 1.3, y: 1.3, z: 1.3 },
                        },
                        700
                      )
                      .delay(1000)
                      .easing(TWEEN.Easing.Cubic.InOut)
                      .onUpdate(() => {
                        this.objects.children[i].position.set(
                          end.positions.x,
                          end.positions.y + i * 200,
                          end.positions.z
                        );
                      })
                      .onComplete(() => {
                        this.objects.visible = false;
                        this.objects.children[i].children.forEach(
                          (elements: any) => {
                            elements.material.clippingPlanes = [];
                          }
                        );
                        this.options.animationStatus = 0;
                        this.options.onlyOnce = true;
                      })
                      .start();
                  })
                  .onUpdate(() => {
                    if (i == 2) {
                      this.objects.children[i].scale.set(
                        end.scale.x,
                        /*end.scale.y*/ 1.3,
                        /*end.scale.z*/ 1.3
                      );
                    }
                  })
              );

            new TWEEN.Tween(start)
              .to(end, 600)
              .delay(50 * i)
              .easing(TWEEN.Easing.Quintic.In)
              .onUpdate(() => {
                //this.objects[i].material.opacity = start.opacity;
              })
              .start();
            new TWEEN.Tween(start)
              .to(end, 600)
              .delay(50 * i)
              .easing(TWEEN.Easing.Quintic.Out)
              .onUpdate(() => {
                this.objects.children[i].scale.set(
                  start.scale.x,
                  start.scale.y,
                  start.scale.z
                );
              })
              .start();
          }
          this.options.onlyOnce = false;
        }
        break;
      case 6:
        if (this.options.onlyOnce) {
          let texte = this.objects[0];
          texte.material.opacity = 1;
          texte.position.set(0, 0, 0);
          texte.scale.set(1, 1, 1);

          let number = 7;
          let height = 1080;
          let taillerepet = height / number + 30;

          let posClones: { x: number; y: number; z: number }[] = [];

          for (
            let i = -Math.round(number / 2);
            i < Math.round(number / 2);
            i++
          ) {
            let pos = { x: 0, y: texte.position.y + taillerepet * i, z: 0 };
            i !== 0 ? posClones.push(pos) : console.log('0');
          }

          let scale = { scale: 1.3 };

          let clones: any[] = [];

          for (let i = 0; i < posClones.length; i++) {
            let clone = texte.clone(false);
            new TWEEN.Tween(scale)
              .to({ scale: 1 }, 50)
              .delay(50 * i)
              .easing(TWEEN.Easing.Exponential.Out)
              .onStart(() => {
                clone.position.set(
                  posClones[i].x,
                  posClones[i].y,
                  posClones[i].z
                );
                clone.scale.set(scale.scale, scale.scale, scale.scale);
                clones.push(clone);
                scene.add(clone);
              })
              .onUpdate(() => {
                clone.scale.set(scale.scale, scale.scale, scale.scale);
              })
              .chain(
                new TWEEN.Tween({})
                  .to({}, 100)
                  .delay(800 - 25 * i)
                  .onComplete(() => {
                    this.options.animationStatus = 0;
                    this.options.onlyOnce = true;
                    scene.remove(clone);
                  })
              )
              .start();
          }
          this.options.onlyOnce = false;
        }
        break;
      case 7:
        if (this.options.onlyOnce) {
          this.options.onlyOnce = false;
        }
        break;
    }
  };
  console.log(obj);
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
  let texts = TextLoader(textString, type, allFontsLoaded);
  let ligneEspaceIndex = 0;
  texts.children.forEach((element) => {
    let lastMaxX = 0;
    element.children.forEach((elem) => {
      if (elem.name === ' ') {
        elem.position.set(lastMaxX + 40, 0, 0);
        lastMaxX = elem.position.x + 20;
      } else {
        console.log(elem);
        let box = new Box3().setFromObject(elem);
        elem.position.set(lastMaxX + 20, 0, 0);
        lastMaxX = elem.position.x + (box.max.x - box.min.x);
      }
      new Box3()
          .setFromObject(elem)
          .getCenter(elem.position)
          .multiplyScalar(1);
    });
    element.position.set(0, ligneEspaceIndex * 150, 0);
    ligneEspaceIndex++;
  });
  scene.add(texts);
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
