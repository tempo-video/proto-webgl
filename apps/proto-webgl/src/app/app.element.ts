/* eslint-disable prefer-const */
import './app.element.scss';
import * as THREE from 'three';
import * as data from '../assets/editor-state.json';
<<<<<<< Updated upstream
import { rejects } from 'assert';
=======
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
import { throttleTime, scan, map, defaultIfEmpty } from 'rxjs';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import RGBEffectShaderMaterial from '../assets/Shaders/VideosShaderMaterials';
>>>>>>> Stashed changes

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

let videoPauseStatus = dataEditor.playbackPaused;

let videoWidth, videoHeight;

let camera, scene, renderer;

let timeouts = [];

let timestart;

let meshSelected;
const raycaster = new THREE.Raycaster();
const click = new THREE.Vector2();
let UserHasClicked = false;

<<<<<<< Updated upstream
let goFront, goBehind, goLeft, goRight, scaleUp, scaleDown;
=======
const clock = new Clock();
let composer: EffectComposer;
let grainEffect: ShaderPass;
>>>>>>> Stashed changes

function init() {
  TouchKeyControl();
  window.addEventListener('click', onClick, false);

  (videoWidth = dataEditor.videoWidth), (videoHeight = dataEditor.videoHeight);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfff0ff);

  camera = new THREE.OrthographicCamera(
    videoWidth / -2,
    videoWidth / 2,
    videoHeight / -2,
    videoHeight / 2,
    0,
    1000
  );
  camera.position.z = 0;
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(videoWidth / 2, videoHeight / 2);
  document.body.appendChild(renderer.domElement);

  animation();
  getAllVideos();
}
init();

<<<<<<< Updated upstream
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
=======
function Composer() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new BloomPass(
    1, // strength
    25, // kernel size
    4, // sigma ?
    256 // blur render target resolution
  );
  //composer.addPass(bloomPass);

  const filmPass = new FilmPass(
    0.35, // noise intensity
    0.025, // scanline intensity
    648, // scanline count
    0 // grayscale
  );
  filmPass.renderToScreen = true;
  //composer.addPass(filmPass);

  const counter = 0.0;
  const grainEffectShader = {
    uniforms: {
      tDiffuse: { value: null },
      amount: { value: counter },
    },
    vertexShader: `varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix 
        * modelViewMatrix 
        * vec4( position, 1.0 );
    }`,
    fragmentShader: `uniform float amount;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
  
    float random( vec2 p )
    {
      vec2 K1 = vec2(
        23.14069263277926, // e^pi (Gelfond's constant)
        2.665144142690225 // 2^sqrt(2) (Gelfondâ€“Schneider constant)
      );
      return fract( cos( dot(p,K1) ) * 12345.6789 );
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
function animation() {
  if (UserHasClicked) {
    raycaster.setFromCamera(click, camera);
    UserHasClicked = false;
=======
////////////////////////////////////////////////////////////////
///////////////////////Fonctions en plus////////////////////////
////////////////////////////////////////////////////////////////

const PlaneGeom: PlaneBufferGeometry[] = [];

let PlaneMat: ShaderMaterial;

function animation() {
  requestAnimationFrame(animation);

  const deltaTime = clock.getElapsedTime();

  PlaneMat.uniforms.uTime.value = clock.getElapsedTime();
  grainEffect.uniforms["amount"].value = clock.getElapsedTime();

  composer.render(deltaTime);
}

////////////////////////////////////////////////////////////////////
//////////////////////////// ELEMENTS //////////////////////////////
////////////////////////////////////////////////////////////////////
>>>>>>> Stashed changes

    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
      meshSelected = intersects[0].object;
    }

<<<<<<< Updated upstream
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
=======
////////////////////////////Add Shape to THREE///////////////////////////

function addShapeThree(shapeInfos: shapeInfos) {
  switch (shapeInfos.id) {
    case 'square': {
      const square = new Mesh(
        new PlaneGeometry(shapeInfos.width, shapeInfos.height),
        new MeshBasicMaterial({
          color: 0xff0f00,
          side: DoubleSide,
        })
      );
      TransformShape(square, shapeInfos);
      break;
    }
    case 'circle': {
      const circle = new Mesh(
        new CircleGeometry(shapeInfos.width, 32),
        new MeshBasicMaterial({
          color: 0xfffff0,
          side: DoubleSide,
        })
      );
      TransformShape(circle, shapeInfos);
      break;
>>>>>>> Stashed changes
    }
  }

<<<<<<< Updated upstream
  requestAnimationFrame(animation);
  renderer.render(scene, camera);
=======
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
  shapeElement.name = element.nameId;
  scene.add(shapeElement);
}

//////////////Load Image//////////////////

function loadTextureImage(textureInfos: string) {
  return new Promise<Texture>(function (resolve, reject) {
    const textureLoader = new TextureLoader();
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
>>>>>>> Stashed changes
}

function videoLoading(video) {
  return new Promise((resolve, reject) => {
    console.log('loading video n°' + video.src);
    resolve(video.load());
  })
}

function hideAllVideos() {
  for (let i = 1; i < scene.children.length; i++) {
    scene.children[i].visible = false;
  }
}

<<<<<<< Updated upstream
function playVideo(video) {
  return new Promise((resolve) => {
    resolve(video.play());
  })
=======
///////////////////////Add Images to THREE////////////////////

function addBrandThree(brandInfos: brandInfos) {
  const loadedtexture = allTextureLoaded.find(
    (element) => element.id === brandInfos.id
  );
  const texture = loadedtexture!.texture;
  const plane = new Mesh(
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
>>>>>>> Stashed changes
}

function setATimeout(ms) {
  return new Promise((resolve) => timeouts.push(setTimeout(resolve, ms)));
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
    const videos = dataEditor.tracks[0].itemIds[i];

    const videoElement = <HTMLVideoElement>document.getElementById(videos);

    const newVideoWidth = videoWidth,
      newVideoHeight = videoHeight;

<<<<<<< Updated upstream
    let newTextureVideo = new THREE.VideoTexture(videoElement);
=======
    const newTextureVideo = new VideoTexture(videoElement);
>>>>>>> Stashed changes

    const videoData = dataEditor.trackItems.find(
      (element) => element.id === videos
    );

<<<<<<< Updated upstream
    let newGeometry = new THREE.PlaneGeometry(
      newVideoWidth * videoData.transform.scale.x,
      newVideoHeight * videoData.transform.scale.y
=======
    const newGeometry = new PlaneGeometry(
      newVideoWidth * videoData!.transform.scale.x,
      newVideoHeight * videoData!.transform.scale.y,
      10,
      10
>>>>>>> Stashed changes
    );

<<<<<<< Updated upstream
    let newMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(),
=======
    const newMaterialRGBShift = RGBEffectShaderMaterial(newTextureVideo);
    PlaneMat = newMaterialRGBShift;

    const newMaterial = new MeshBasicMaterial({
>>>>>>> Stashed changes
      map: newTextureVideo,
      side: THREE.DoubleSide,
    });

<<<<<<< Updated upstream
    let newMesh = new THREE.Mesh(newGeometry, newMaterial);
=======
    const newMesh = new Mesh(newGeometry, newMaterialRGBShift);
>>>>>>> Stashed changes
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
  getVideoByTs(dataEditor.playbackPosition);
}

async function getVideoByTs(ts) {
  for (let i = 0; i < timeouts.length; i++) {
    clearTimeout(timeouts[i]);
  }

  console.log('timestamp', ts);

<<<<<<< Updated upstream
  let videosOnTs = [];
=======
async function playVideo(id: string, start: number) {
  const videoElement = <HTMLVideoElement>document.getElementById(id);
  console.log(videoElement);
  const videoObject = scene.getObjectByName(id);
>>>>>>> Stashed changes

  for (let i = 0; i < dataEditor.trackItems.length; i++) {
    let video = dataEditor.trackItems[i];

    let start = video.ts;
    let end = start + video.duration;

<<<<<<< Updated upstream
    if (start <= ts && ts <= end) {
      videosOnTs.push(video);
    }
  }
  if (videosOnTs.length > 0) {
    afficheVideo(videosOnTs, ts);
  } else if (ts < dataEditor.playbackDuration) {
    console.log('pas de video a ce timestamp');

    hideAllVideos();

    let nextVideos = [];
    
    for (let i = 0; i < dataEditor.trackItems.length; i++) {
      let video = dataEditor.trackItems[i];
      if (video.ts > ts) {
        nextVideos.push(video.ts);
=======
///////////////////////////////////////////////////////////////
//////////////////////////// TEXT /////////////////////////////
///////////////////////////////////////////////////////////////

///////////////////////Load Font///////////////////////////////

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
>>>>>>> Stashed changes
      }
    }
    if (nextVideos.length > 0 && videoPauseStatus) {
      let timeWithNoVideo = closest(ts, nextVideos) - ts;

      await setATimeout(timeWithNoVideo);

      getVideoByTs(ts + timeWithNoVideo + 1);

      console.log('temps sans video', timeWithNoVideo);
    }
  } else {
    console.log('end of the playback', Date.now() - timestart);
  }
}

function closest(num, arr) {
  let curr = arr[0];
  let diff = Math.abs(num - curr);
  for (let val = 0; val < arr.length; val++) {
    let newdiff = Math.abs(num - arr[val]);
    if (newdiff < diff) {
      diff = newdiff;
      curr = arr[val];
    }
  }
  return curr;
}

<<<<<<< Updated upstream
async function afficheVideo(videos, ts) {
  let videosElements = <HTMLVideoElement>document.getElementById(videos[0].id);

  let timeStartVideo: number = ts - videos[0].ts + videos[0].videoOffset;

  let ThreeObject = scene.getObjectByName(videos[0].id);

  hideAllVideos();
=======
///////////////////////Add Text to THREE/////////////////////////

function TextLoader(textString: string, type: string) {
  const fontIndex = allFontsLoaded.findIndex((element) => {
    return element.name === type;
  });
  console.log(allFontsLoaded[fontIndex]);
  const textGeo = new TextGeometry(textString, {
    size: 100,
    height: 100,
    curveSegments: 6,
    font: allFontsLoaded[fontIndex].font,
  });
  const color = new Color();
  color.setRGB(255, 255, 255);
  const textMaterial = new MeshBasicMaterial({
    color: color,
    side: DoubleSide,
  });
  const text = new Mesh(textGeo, textMaterial);
  text.name = type; // Changer sur le id du texte
  text.position.set(-200, 0, 8);
  text.rotation.set(Math.PI, 0, 0);
  scene.add(text);
}
>>>>>>> Stashed changes

  ThreeObject.visible = true;

  try {
    if (videoPauseStatus && videosElements) {

      console.log(
        'before promise play',
        videosElements.paused
      );

      await playVideo(videosElements);

      console.log(
        'after promise play',
        videosElements.paused
      );

      videosElements.currentTime = timeStartVideo / 1000;

      let videoPlayDuration =
        videos[0].videoOffset + videos[0].duration - timeStartVideo;

      console.log('temps de lecture de la vidéo', videoPlayDuration);

      await setATimeout(videoPlayDuration);

      getVideoByTs(ts + videoPlayDuration + 1);
      videosElements.pause();
    }
  }
  catch (error) {
    console.log('play video error', error);
  }
}

document.getElementById('button').addEventListener('click', () => {
  let tsChange = Number(
    (<HTMLInputElement>document.getElementById('ts')).value
  );
  if (tsChange !== null) {
    console.log('change ts', tsChange);
    getVideoByTs(tsChange);
  }
});
