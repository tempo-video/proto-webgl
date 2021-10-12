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
} from 'three';
import * as data from '../assets/editor-state.json';
import {
  fromEvent,
  Observable,
  generate,
  from,
  forkJoin,
  of,
  firstValueFrom,
} from 'rxjs';
import { throttleTime, scan, map, defaultIfEmpty } from 'rxjs';

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    const title = 'proto-webgl';
    this.innerHTML =
      `
      <h1>` +
      title +
      `</h1>
      <div id="videos" ></div>
      <input id="ts" type="number" /><input type="button" id="button" ><p id="ts-result"></p>`;
  }
}
customElements.define('proto-webgl-root', AppElement);

const dataEditor = data.editor;

let videoWidth, videoHeight;

let camera, scene, renderer;

interface LoadedTexture {
  id: string;
  texture: Texture;
}

interface LoadedFont {
  url: string;
  font: Font;
}

let allFontsLoaded: Array<LoadedFont> = [],
  allTextureLoaded: Array<LoadedTexture> = [];

let meshSelected;
const raycaster = new Raycaster();
const click = new Vector2();
let UserHasClicked = false;

let goFront, goBehind, goLeft, goRight, scaleUp, scaleDown;

////////////////////////////////////////////////////////
////////////////Initialisation de THREE/////////////////
////////////////////////////////////////////////////////

async function init() {
  TouchKeyControl();
  window.addEventListener('click', onClick, false);

  (videoWidth = dataEditor.videoWidth), (videoHeight = dataEditor.videoHeight);

  scene = new Scene();
  scene.background = new Color(0xfff0ff);

  camera = new OrthographicCamera(
    videoWidth / -2,
    videoWidth / 2,
    videoHeight / -2,
    videoHeight / 2,
    -10,
    1000
  );
  camera.position.z = 0;
  scene.add(camera);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(videoWidth / 2, videoHeight / 2);
  document.body.appendChild(renderer.domElement);

  //load all the assets
  console.log('loading');
  await getAllVideos();
  await TexturesLoader();
  await FontsLoader();
  console.log(allFontsLoaded);
  console.log('loaded');

  //Add them in threejs
  getAllElements();
  TextLoader('salutttt', '../assets/Memphis.json');
  TextLoader('coucou', 'regular');
  TextLoader('bonjour', 'headline');
  playVideo('dd6a50d4-3f30-4007-a953-d9748b266462', 3000);
  animation();
}

////////////////////////////////////////////////////////////////
///////////////////////Fonctions en plus////////////////////////
////////////////////////////////////////////////////////////////

function onClick(event) {
  click.x = (event.clientX / window.innerWidth) * 2 - 1;
  click.y = -(event.clientY / window.innerHeight) * 2 + 1;
  UserHasClicked = true;
}

function TouchKeyControl() {
  const onKeyDown = function (event) {
    switch (event.key) {
      case 'z':
        goFront = true;
        break;
      case 'q':
        goLeft = true;
        break;
      case 's':
        goBehind = true;
        break;
      case 'd':
        goRight = true;
        break;
      case 'ArrowUp':
        scaleUp = true;
        break;
      case 'ArrowDown':
        scaleDown = true;
        break;
      case ' ':
        console.log('space');
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.key) {
      case 'z':
        goFront = false;
        break;
      case 'q':
        goLeft = false;
        break;
      case 's':
        goBehind = false;
        break;
      case 'd':
        goRight = false;
        break;
      case 'ArrowUp':
        scaleUp = false;
        break;
      case 'ArrowDown':
        scaleDown = false;
        break;
    }
  };
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
}

function animation() {
  if (UserHasClicked) {
    raycaster.setFromCamera(click, camera);
    UserHasClicked = false;

    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
      meshSelected = intersects[0].object;
    }

    if (goRight) {
      meshSelected.position.x += 0.2;
    }
    if (goLeft) {
      meshSelected.position.x -= 0.2;
    }
    if (goFront) {
      meshSelected.position.y -= 0.2;
    }
    if (goBehind) {
      meshSelected.position.y += 0.2;
    }
    if (scaleUp) {
      meshSelected.scale.x += 0.01;
      meshSelected.scale.y += 0.01;
    }
    if (scaleDown) {
      meshSelected.scale.x -= 0.01;
      meshSelected.scale.y -= 0.01;
    }
  }

  requestAnimationFrame(animation);
  renderer.render(scene, camera);
}

////////////////////////////////////////////////////////////////////
//////////////////////////// ELEMENTS //////////////////////////////
////////////////////////////////////////////////////////////////////

//////////////////////////Get Elements//////////////////////////////

async function getAllElements() {
  for (let i = 0; i < dataEditor.elementModels.length; i++) {
    let element = dataEditor.elementModels[i];
    switch (element.categoryId) {
      case 'shape':
        addShapeThree(element);
        break;
      case 'brand':
        addBrandThree(element);
        break;
    }
  }
}

////////////////////////////Add Shape to THREE///////////////////////////

function addShapeThree(shapeInfos) {
  switch (shapeInfos.id) {
    case 'square':
      let square = new Mesh(
        new PlaneGeometry(shapeInfos.width, shapeInfos.height),
        new MeshBasicMaterial({
          color: 0xff0f00,
          side: DoubleSide,
        })
      );
      square.position.set(
        shapeInfos.transform.translation.x,
        shapeInfos.transform.translation.y,
        shapeInfos.depth
      );
      square.rotation.set(
        shapeInfos.transform.rotation.x,
        shapeInfos.transform.rotation.y,
        shapeInfos.transform.rotation.z
      );
      square.scale.set(
        shapeInfos.transform.scale.x,
        shapeInfos.transform.scale.y,
        shapeInfos.transform.scale.z
      );
      square.name = shapeInfos.nameId;
      scene.add(square);
      break;
    case 'circle':
      let circle = new Mesh(
        new CircleGeometry(shapeInfos.width, 32),
        new MeshBasicMaterial({
          color: 0xfffff0,
          side: DoubleSide,
        })
      );
      circle.position.set(
        shapeInfos.transform.translation.x,
        shapeInfos.transform.translation.y,
        shapeInfos.depth
      );
      circle.rotation.set(
        shapeInfos.transform.rotation.x,
        shapeInfos.transform.rotation.y,
        shapeInfos.transform.rotation.z
      );
      circle.scale.set(
        shapeInfos.transform.scale.x,
        shapeInfos.transform.scale.y,
        shapeInfos.transform.scale.z
      );
      circle.name = shapeInfos.nameId;
      scene.add(circle);
      break;
  }
}

//////////////Load Image//////////////////

function loadTextureImage(textureInfos) {
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

function addBrandThree(brandInfos) {
  console.log('coucou', allTextureLoaded);
  const loadedtexture = allTextureLoaded.find(
    (element) => element.id === brandInfos.id
  );
  const texture = loadedtexture.texture;
  let plane = new Mesh(
    new PlaneGeometry(brandInfos.width, brandInfos.height),
    new MeshBasicMaterial({
      color: new Color(),
      map: texture,
      side: DoubleSide,
    })
  );
  plane.position.set(
    brandInfos.transform.translation.x,
    brandInfos.transform.translation.y,
    brandInfos.depth
  );
  plane.rotation.set(
    MathUtils.degToRad(brandInfos.transform.rotation.x) + Math.PI,
    MathUtils.degToRad(brandInfos.transform.rotation.y),
    MathUtils.degToRad(brandInfos.transform.rotation.z)
  );
  plane.scale.set(
    brandInfos.transform.scale.x,
    brandInfos.transform.scale.y,
    brandInfos.transform.scale.z
  );
  plane.name = brandInfos.id;
  scene.add(plane);
}

///////////////////////////////////////////////
/////////////////// VIDEO /////////////////////
///////////////////////////////////////////////

function videoLoading(video) {
  return new Promise((resolve, reject) => {
    console.log('loading video n°' + video.src);
    resolve(video.load());
  });
}

async function getAllVideos() {
  for (let i = 0; i < dataEditor.tracks[0].itemIds.length; i++) {
    let video = document.createElement('video');
    video.id = dataEditor.tracks[0].itemIds[i];
    let videoSrc = dataEditor.trackItems.find(
      (element) => element.id == video.id
    );
    video.src = '../assets/' + videoSrc.videoId + '.mp4';
    document.getElementById('videos').appendChild(video);
    await videoLoading(video);
  }
  addAllVideosThree();
}

function addAllVideosThree() {
  for (let i = 0; i < dataEditor.tracks[0].itemIds.length; i++) {
    let videos = dataEditor.tracks[0].itemIds[i];

    let videoElement = <HTMLVideoElement>document.getElementById(videos);

    let newVideoWidth = videoWidth,
      newVideoHeight = videoHeight;

    let newTextureVideo = new VideoTexture(videoElement);

    let videoData = dataEditor.trackItems.find(
      (element) => element.id === videos
    );

    let newGeometry = new PlaneGeometry(
      newVideoWidth * videoData.transform.scale.x,
      newVideoHeight * videoData.transform.scale.y
    );

    let newMaterial = new MeshBasicMaterial({
      map: newTextureVideo,
      side: DoubleSide,
    });

    let newMesh = new Mesh(newGeometry, newMaterial);
    newMesh.name = videos;
    newMesh.rotation.set(
      Math.PI + videoData.transform.rotation.x,
      videoData.transform.rotation.y,
      0
    );
    newMesh.position.set(
      videoData.transform.translation.x,
      videoData.transform.translation.y,
      0
    );
    scene.add(newMesh);
  }
}

function pauseVideo(id) {
  if (id) {
    let videoObject = scene.getObjectByName(id);
    videoObject.visible = false;

    let videoElement = <HTMLVideoElement>document.getElementById(id);
    videoElement.pause();
  }
}

function playVideoPromise(video) {
  return new Promise((resolve) => {
    resolve(video.play());
  });
}

async function playVideo(id, start: number) {
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

function loadFontThree(url) {
  return new Promise<Font>(function (resolve, reject) {
    let fontLoader = new FontLoader();
    fontLoader.load(
      url,
      function (font) {
        resolve(font);
      },
      null,
      function (err) {
        reject(err);
      }
    );
  });
}

async function FontsLoader() {
  const fontsToLoadUrl = dataEditor.textModels.map((element) => element.url);
  const loadedFonts$ = loadFonts(fontsToLoadUrl);
  const promise = firstValueFrom(loadedFonts$);
  allFontsLoaded = await promise;
}

function loadFonts(urls: string[]): Observable<LoadedFont[]> {
  const observables = urls.map((url) => loadFont(url));
  return forkJoin(observables).pipe(defaultIfEmpty([]));
}

function loadFont(url: string): Observable<LoadedFont> {
  return from(loadFontThree(url)).pipe(
    map((font) => ({
      url,
      font
    }))
  )
}

///////////////////////Add Text to THREE/////////////////////////

function TextLoader(textString, type) {
  var fontIndex = allFontsLoaded.findIndex((element) => {
    return element.url === type;
  });
  var textGeo = new TextGeometry(textString, {
    size: 100,
    height: 100,
    curveSegments: 6,
    font: allFontsLoaded[0].font,
  });
  var color = new Color();
  color.setRGB(255, 250, 250);
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
  }
})
*/

init();
