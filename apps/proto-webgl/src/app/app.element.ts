/*
interface X {
  str: string;
}
interface Y extends X {
  str2: string;
}

interface Z {
  b: boolean;
}

type W = X & Z;
type WWithoutStr = Pick<W, 'str' | 'b'>;

interface Ex<T> {
  type: string;
  data: T;
}

const variable: Ex<string> = {
  type: 'tt',
  data: '01'
}

function create<T>(value: T): Ex<T> {
  return {
    type: 'truc',
    data: value
  }
}

const example = create({
  bleh: 'truc'
})
example.data.bleh.
*/

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
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
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
import { throttleTime, scan, map, defaultIfEmpty } from 'rxjs';
import { Noise } from 'noisejs';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
//@ts-ignore
//import vertexShader from "../assets/gl/vertex.glsl";
//@ts-ignore
//import fragmentShader from "../assets/gl/fragment.glsl";

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

let videoWidth: number, videoHeight: number;

let camera: Camera, cameraP: Camera, scene: Scene, renderer: WebGLRenderer;

interface LoadedTexture {
  id: string;
  texture: Texture;
}

interface LoadedFont {
  name: string;
  url: string;
  font: Font;
}

interface Transform {
  transform: {
    translation: {
      x: number;
      y: number;
      z: number;
    };
    rotation: {
      x: number;
      y: number;
      z: number;
    };
    scale: {
      x: number;
      y: number;
      z: number;
    };
  };
}

interface brandInfos extends Transform {
  id: string;
  width: number;
  height: number;
  depth: number;
}

interface shapeInfos extends brandInfos {
  categoryId: string;
  nameId: string;
}

let allFontsLoaded: Array<LoadedFont> = [],
  allTextureLoaded: Array<LoadedTexture> = [];

let meshSelected: Object3D;
const raycaster = new Raycaster();
const click = new Vector2();

var clock = new Clock();
let composer: EffectComposer;
let grainEffect: ShaderPass;
var delta = 0;
var time = 0;

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
  cameraP = new PerspectiveCamera(45, videoWidth / videoHeight, 1, 1000);
  //scene.add( cameraP );

  camera.position.z = 20;
  scene.add(camera);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(videoWidth / 2, videoHeight / 2);
  document.body.appendChild(renderer.domElement);

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
  //getAllElements();
  //TextLoader('salutttt', 'fun');
  //TextLoader('coucou', 'regular');
  //TextLoader('bonjour', 'headline');
  playVideo('dd6a50d4-3f30-4007-a953-d9748b266462', 0);
  animation();
}

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

  var counter = 0.0;
  var grainEffectShader = {
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
    }
  
    void main() {
  
      vec4 color = texture2D( tDiffuse, vUv );
      vec2 uvRandom = vUv;
      uvRandom.y *= random(vec2(uvRandom.y,amount));
      color.rgb += random(uvRandom)*0.25;
      gl_FragColor = vec4( color  );
    }`,
  };

  grainEffect = new ShaderPass(grainEffectShader);
  grainEffect.renderToScreen = true;
  composer.addPass(grainEffect);
}

////////////////////////////////////////////////////////////////
///////////////////////Fonctions en plus////////////////////////
////////////////////////////////////////////////////////////////

let PlaneGeom: PlaneBufferGeometry[] = [];

let PlaneMat: ShaderMaterial;

function animation() {
  requestAnimationFrame(animation);

  let deltaTime = clock.getElapsedTime();

  PlaneMat.uniforms.uTime.value = clock.getElapsedTime();
  grainEffect.uniforms["amount"].value = clock.getElapsedTime();

  composer.render(deltaTime);
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

function addBrandThree(brandInfos: brandInfos) {
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

function videoLoading(video: HTMLVideoElement) {
  return new Promise<void>((resolve, _reject) => {
    console.log('loading video n°' + video.src);
    fromEvent(video, 'loadeddata').subscribe(() => resolve());
  });
}

async function getAllVideos() {
  const IdsVideo = dataEditor.tracks[0].itemIds;

  const videoElements = IdsVideo.map((element) =>
    createVideoHtmlElement(element)
  );
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

//const observables$ = urls.map((url) => from(loadFontThree(url)));

function addAllVideosThree() {
  console.log('lancer addAllVideosThree');
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
      newVideoWidth * videoData!.transform.scale.x,
      newVideoHeight * videoData!.transform.scale.y,
      10,
      10
    );
    PlaneGeom.push(newGeometry);

    let newMaterialRGBShift = new ShaderMaterial({
      vertexShader: `varying vec2 vUv;
      uniform float uTime;

      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      
      vec4 permute(vec4 x) {
           return mod289(((x*34.0)+1.0)*x);
      }
      
      vec4 taylorInvSqrt(vec4 r)
      {
        return 1.79284291400159 - 0.85373472095314 * r;
      }
      
      float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        
        // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;
        
        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
      
        //   x0 = x0 - 0.0 + 0.0 * C.xxx;
        //   x1 = x0 - i1  + 1.0 * C.xxx;
        //   x2 = x0 - i2  + 2.0 * C.xxx;
        //   x3 = x0 - 1.0 + 3.0 * C.xxx;
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
        vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
        
        // Permutations
        i = mod289(i);
        vec4 p = permute( permute( permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                 
        // Gradients: 7x7 points over a square, mapped onto an octahedron.
        // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
        float n_ = 0.142857142857; // 1.0/7.0
        vec3  ns = n_ * D.wyz - D.xzx;
      
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
      
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
      
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
      
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
      
        //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
        //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
      
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        
        // Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                      dot(p2,x2), dot(p3,x3) ) );
      }
      
      void main() {
        vUv = uv;

        vec3 pos = position;
        float noiseFreq = 3.5;
        float noiseAmp = 10.0;
        vec3 noisePos = vec3(pos.x, pos.y * noiseFreq + uTime, pos.z);
        pos.x += snoise(noisePos) * noiseAmp;
        pos.y += snoise(noisePos) * noiseAmp;
      
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
      }`,
      fragmentShader: `uniform float uTime;
      uniform sampler2D uTexture;
      uniform float uAlpha;
      varying vec2 uOffset;
      varying vec2 vUv;

      vec3 rgbShift(sampler2D textureimage, vec2 uv, vec2 offset ){
        float r = texture2D(textureimage, uv + offset).r;
        vec2 gb = texture2D(textureimage, uv).gb;
        return vec3(r, gb);
      }
      
      void main() {
        vec2 uOffset = vec2(sin(uTime * 10.) / 50., sin(-uTime * 5.) / 50.);

        vec3 color = rgbShift(uTexture, vUv, uOffset);
        
        gl_FragColor = vec4(color, uAlpha);
      }
      `,
      uniforms: {
        uTime: { value: 0.0 },
        uTexture: { value: newTextureVideo },
        uAlpha: { value: 1 },
        uOffset: { value: new Vector2(0.02, 0.02) },
      },
      side: DoubleSide,
    });
    PlaneMat = newMaterialRGBShift;

    let newMaterial = new MeshBasicMaterial({
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
    scene.add(newMesh);
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
  }
})
*/

init();
