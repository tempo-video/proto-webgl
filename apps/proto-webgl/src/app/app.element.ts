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
  Event,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import * as data from '../assets/editor-state.json';
import { fromEvent, firstValueFrom, of, from, filter, Observable, elementAt } from 'rxjs';
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

import * as animejs from 'animejs';

import anime from 'animejs';

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

const animations: any[] = [];

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
  addTextThree('Bienvenue\nsur le site\nTEMPO\nHello', 'regular');
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

let onlyOnce = true;

let obj: { objects: Object3D<Event> };

function animation(time: any) {
  requestAnimationFrame(animation);

  const deltaTime = clock.getElapsedTime();
  const Dt = clock.getDelta();

  TWEEN.update(time);

  if (scene.children[1] && onlyOnce) {
    obj = {
      objects: scene.children[1],
    };

    onlyOnceF(obj);

    onlyOnce = false;
  }

  //Scenes[2].render();
  //Scenes[1].render();
  //Scenes[0].render();

  composerAnimation(composer, deltaTime);
}

import * as test from '../assets/test.json';

interface animation {
  type: any;
  options: string[];
  id: number;
  start: any;
  end: any;
  duration: number;
  easing: string;
  delay: number;
  chain: any[];
  target: string;
  per: number;
}

interface groupAnimation {
  objet: string;
  name: string;
  animStart: number[];
  index: number;
  animations: animation[] | undefined;
}

function createAnimation(element: groupAnimation) {
  const object = scene.getObjectByName(element.objet);

  animCreate(
    element,
    findAnimations(element.animations!, element.animStart),
    object!
  );
}

function findAnimations(animationList: animation[], listId: number[]) {
  const animsToStart: animation[] = [];
  const anims: Observable<unknown> = from(animationList);

  const animations = anims.pipe(filter((num: any) => listId.includes(num.id)));

  animations.subscribe((element) => animsToStart.push(element));

  return animsToStart;
}

function animCreate(
  groupAnimation: groupAnimation,
  elements: animation[],
  object: Object3D,
  parentTween?: TWEEN.Tween<any>
) {
  const groupAnimToChain: TWEEN.Group = new TWEEN.Group();
  elements.forEach((element: animation) => {
    let tween: any = switchType(element, object as Mesh);
    console.log('tween', tween);
    tween.play();
    /*if (tween!.getAll) {
      let tweens = tween.getAll();
      tweens.forEach((elementTween: TWEEN.Tween<any>) => {
        if (element.chain) {
          let animsToChain = findAnimations(
            groupAnimation.animations!,
            element.chain
          );
          animCreate(groupAnimation, animsToChain, object, elementTween);
        }
        if (parentTween) {
          groupAnimToChain.add(elementTween);
        } else {
          elementTween.start();
        }
      });
    } else {
      if (element.chain) {
        animCreate(
          groupAnimation,
          findAnimations(groupAnimation.animations!, element.chain),
          object,
          tween
        );
      }
      if (parentTween) {
        groupAnimToChain.add(tween);
      } else {
        tween?.start();
      }
    }*/
  });
  let animstochain = groupAnimToChain.getAll();
  if (parentTween !== undefined && animstochain[0]) {
    console.log(parentTween, 'tween to chain first : ', animstochain[0]);
    /*parentTween.chain(animstochain[0]);

    animstochain[0].onStart(() => {
      for (let i = 1; i < animstochain.length; i++) {
        animstochain[i].start();
      }
    });*/
    ////////// a changer trouvez autre choses c moches la ///////////////

    switch (animstochain.length) {
      case 1:
        parentTween.chain(animstochain[0]);
        break;
      case 2:
        parentTween.chain(animstochain[0], animstochain[1]);
        break;
      case 3:
        parentTween.chain(animstochain[0], animstochain[1], animstochain[2]);
        break;
      case 4:
        parentTween.chain(
          animstochain[0],
          animstochain[1],
          animstochain[2],
          animstochain[3]
        );
        break;
      case 5:
        parentTween.chain(
          animstochain[0],
          animstochain[1],
          animstochain[2],
          animstochain[3],
          animstochain[4]
        );
        break;
      case 6:
        parentTween.chain(
          animstochain[0],
          animstochain[1],
          animstochain[2],
          animstochain[3],
          animstochain[4],
          animstochain[5]
        );
        break;
    }
  }
}

function switchType(element: animation, object: Mesh) {
  switch (element.type) {
    case 'anime':
      var coords = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
      ];

      return anime({
        targets: coords,
        x: element.end.x,
        y: element.end.y,
        z: element.end.z,
        round: 1,
        easing: element.easing,
        duration: element.duration,
        autoplay : false,
        update: function () {
          object.children.forEach((element, index) => {
            element.position.set(coords[index].x, coords[index].y + 200 * index, coords[index].z);
          })
        },
        delay: anime.stagger(200),
      });
    case 'translation':
      if (element.target === 'line') {
        let tweenGroup: TWEEN.Group = new TWEEN.Group();
        object.children.forEach((elem, index) => {
          const box = new Box3().setFromObject(elem);
          const height = box.max.y - box.min.y;
          let positionTranslationLine = JSON.parse(
            JSON.stringify(element.start)
          );
          let newTween = new TWEEN.Tween(positionTranslationLine)
            .to(element.end, element.duration)
            .easing(TWEEN.Easing.Quartic.InOut)
            .delay(element.delay * index)
            .onStart(() => {
              object.position.set(
                element.end.translate.x,
                element.end.translate.y,
                element.end.translate.z
              );
              elem.position.set(
                element.start.translate.x,
                element.start.translate.y + (height + 50) * index,
                element.start.translate.z
              );
              if (element.options.includes('clipping')) {
                object.visible = true;
                let i = 0;
                elem.children.forEach((elem: any) => {
                  elem.material.clippingPlanes = [
                    new Plane(
                      new Vector3(0, 1, 0),
                      -(
                        (element.options.includes('clipping-out')
                          ? element.start
                          : element.end
                        ).translate.y -
                        height +
                        (height + 50) * i
                      )
                    ),
                    new Plane(
                      new Vector3(0, -1, 0),
                      (element.options.includes('clipping-out')
                        ? element.start
                        : element.end
                      ).translate.y +
                        (height + 50) * i
                    ),
                  ];
                });
                i++;
              }
            })
            .onUpdate(() => {
              elem.position.set(
                positionTranslationLine.translate.x,
                positionTranslationLine.translate.y + (height + 50) * index,
                positionTranslationLine.translate.z
              );
            })
            .onComplete(() => {
              if (element.options.includes('clipping')) {
                object.children.forEach((lines) => {
                  lines.children.forEach((elements: any) => {
                    elements.material.clippingPlanes = [];
                  });
                });
              }
            });
          tweenGroup.add(newTween);
        });
        console.log('tweengroup', tweenGroup);
        return tweenGroup;
      } else {
        let positionTranslation = JSON.parse(JSON.stringify(element.start));
        let tweenTranslation = new TWEEN.Tween(positionTranslation)
          .to(element.end, element.duration)
          .easing(TWEEN.Easing.Quartic.InOut)
          .delay(element.delay)
          .onStart(() => {
            object.position.set(
              element.start.translate.x,
              element.start.translate.y,
              element.start.translate.z
            );
            if (element.options.includes('clipping')) {
              object.visible = true;
              let i = 0;
              object.children.forEach((line: any) => {
                const box = new Box3().setFromObject(line);
                const height = box.max.y - box.min.y;
                line.children.forEach(
                  (elem: { material: { clippingPlanes: Plane[] } }) => {
                    elem.material.clippingPlanes = [
                      new Plane(
                        new Vector3(0, 1, 0),
                        -(
                          (element.options.includes('clipping-out')
                            ? element.start
                            : element.end
                          ).translate.y -
                          height +
                          (height + 50) * i
                        )
                      ),
                      new Plane(
                        new Vector3(0, -1, 0),
                        (element.options.includes('clipping-out')
                          ? element.start
                          : element.end
                        ).translate.y +
                          (height + 50) * i
                      ),
                    ];
                  }
                );
                i++;
              });
            }
          })
          .onUpdate(() => {
            object.position.set(
              positionTranslation.translate.x,
              positionTranslation.translate.y,
              positionTranslation.translate.z
            );
          })
          .onComplete(() => {
            if (element.options.includes('clipping')) {
              object.children.forEach((lines) => {
                lines.children.forEach((elements: any) => {
                  elements.material.clippingPlanes = [];
                });
              });
            }
          });
        return tweenTranslation;
      }
    case 'scale':
      let positionScale = JSON.parse(JSON.stringify(element.start));
      let tweenScale = new TWEEN.Tween(positionScale)
        .to(element.end, element.duration)
        .easing(TWEEN.Easing.Back.InOut)
        .delay(element.delay)
        .onStart(() => {
          object.scale.set(
            element.start.scale.x,
            element.start.scale.y,
            element.start.scale.z
          );
          //object.position.set(0, 0, 0);
        })
        .onUpdate(() => {
          console.log(positionScale.scale.y);
          object.scale.set(
            positionScale.scale.x,
            positionScale.scale.y,
            positionScale.scale.z
          );
        })
        .onComplete(() => {
          //object.scale.set(1, 1, 1);
        });
      return tweenScale;
    case 'duplicate':
      object.children.forEach((element: { visible: boolean }) => {
        element.visible = false;
      });
      const texte = object.children[0 /* a changer avec target*/];
      console.log(texte);
      texte.visible = true;

      const number = 9;
      const height = 1080;
      const taillerepet = height / number + 30;

      const posClones: { x: number; y: number; z: number }[] = [];

      for (let i = -Math.round(number / 2); i < Math.round(number / 2); i++) {
        const pos = {
          x: texte.position.x,
          y: texte.position.y + taillerepet * i,
          z: 0,
        };
        i !== 0 ? posClones.push(pos) : null;
      }

      object.position.set(0, 0, 0);

      const clones: any[] = [];

      let tweenDuplicate = new TWEEN.Group();
      let startDuplicate = JSON.parse(JSON.stringify(element.start));
      for (let i = 0; i < posClones.length; i++) {
        const clone = texte.clone(true);
        tweenDuplicate.add(
          new TWEEN.Tween(startDuplicate)
            .to(element.end, element.duration)
            .easing(TWEEN.Easing.Back.InOut)
            .delay(element.delay * i)
            .onStart(() => {
              clone.position.set(
                posClones[i].x,
                posClones[i].y,
                posClones[i].z
              );
              clone.scale.set(
                startDuplicate.scale.x,
                startDuplicate.scale.y,
                startDuplicate.scale.z
              );
              clones.push(clone);
              scene.add(clone);
            })
            .onUpdate(() => {
              clone.scale.set(
                startDuplicate.scale.x,
                startDuplicate.scale.y,
                startDuplicate.scale.z
              );
            })
            .onComplete(() => {
              console.log(element.start, element.end);
              new TWEEN.Tween({})
                .to({}, 100)
                .delay(800 - 25 * i)
                .onComplete(() => {
                  scene.remove(clone);
                  object.children.forEach((element: { visible: boolean }) => {
                    element.visible = true;
                  });
                })
                .start();
            })
        );
      }
      console.log(tweenDuplicate.getAll());
      return tweenDuplicate;
    case 'opacity':
      let positionOpacity = JSON.parse(JSON.stringify(element.start));
      let objet: Mesh[] = [object as Mesh];
      let objets: any[] = [];
      while (!objet[0].material) {
        objet.forEach((element) => {
          element.children?.forEach((element) => {
            objets.push(element);
          });
        });
        objet = [];
        objet = objets;
        objets = [];
      }
      if (element.options.includes('visible-in')) {
        objet.forEach((objet: any) => {
          objet.material.opacity = element.start.opacity;
          objet.material.transparent = true;
        });
      }
      let tweenOpacity = new TWEEN.Group();
      objet.forEach((objet: any, index) => {
        tweenOpacity.add(
          new TWEEN.Tween(positionOpacity)
            .to(element.end, element.duration)
            .easing(TWEEN.Easing.Quartic.InOut)
            .delay(element.delay * index)
            .onUpdate(() => {
              objet.material.opacity = positionOpacity.opacity;
            })
            .onComplete(() => {
              //objet.material.opacity.set(1, 1, 1);
              console.log(element.start, element.end);
            })
        );
      });
      return tweenOpacity;
  }
}

function onlyOnceF(obj: any) {
  let div = document.createElement('div');

  let ul = document.createElement('ul');
  test.forEach((element) => {
    let li = document.createElement('li');
    li.addEventListener('click', () => {
      createAnimation(element);
    });
    li.innerHTML = element.name;
    ul.append(li);
  });
  div.append(ul);

  document.getElementById('gui')?.appendChild(div);

  obj.options = {
    animationStatus: 0,
    end: -150,
    start: 300,
    duration: 50,
    i: -10,
    oldAngle: 0,
    onlyOnce: true,
  };
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

const TransitionSpeed = 1;

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
  const texts = TextLoader(textString, type, allFontsLoaded);
  texts.name = 'Group';
  let ligneEspaceIndex = 0;
  texts.children.forEach((element) => {
    let lastMaxX = 0;
    element.children.forEach((elem) => {
      if (elem.name === ' ') {
        elem.position.set(lastMaxX + 40, 0, 0);
        lastMaxX = elem.position.x + 20;
      } else {
        const box = new Box3().setFromObject(elem);
        elem.position.set(lastMaxX + 20, 0, 0);
        lastMaxX = elem.position.x + (box.max.x - box.min.x);
      }
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
