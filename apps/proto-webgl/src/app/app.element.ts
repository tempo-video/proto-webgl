import './app.element.scss';
import * as THREE from 'three';
import * as data from '../assets/editor-state.json';

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

let goFront, goBehind, goLeft, goRight, scaleUp, scaleDown;

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

function getAllVideos() {
  for (let i = 0; i < dataEditor.tracks[0].itemIds.length; i++) {
    let video = document.createElement('video');
    video.id = dataEditor.tracks[0].itemIds[i];
    let videoSrc = dataEditor.trackItems.find(
      (element) => element.id == video.id
    );
    video.src = '../assets/' + videoSrc.videoId + '.mp4';
    document.getElementById('videos').appendChild(video);
  }
  addAllVideosThree();
}

function addAllVideosThree() {
  for (let i = 0; i < dataEditor.tracks[0].itemIds.length; i++) {
    let videos = dataEditor.tracks[0].itemIds[i];

    let videoElement = <HTMLVideoElement>document.getElementById(videos);

    let newVideoWidth = videoWidth,
      newVideoHeight = videoHeight;

    let newTextureVideo = new THREE.VideoTexture(videoElement);

    let videoData = dataEditor.trackItems.find(
      (element) => element.id === videos
    );

    let newGeometry = new THREE.PlaneGeometry(
      newVideoWidth * videoData.transform.scale.x,
      newVideoHeight * videoData.transform.scale.y
    );

    let newMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(),
      map: newTextureVideo,
      side: THREE.DoubleSide,
    });

    let newMesh = new THREE.Mesh(newGeometry, newMaterial);
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
  console.log('start timer now');
  timestart = Date.now();
}

function getVideoByTs(ts) {
  for (var i = 0; i < timeouts.length; i++) {
    clearTimeout(timeouts[i]);
  }

  console.log('timestamp', ts);

  let videosOnTs = [];

  for (var i = 0; i < dataEditor.trackItems.length; i++) {
    let video = dataEditor.trackItems[i];

    let start = video.ts;
    let end = start + video.duration;

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
      }
    }
    if (nextVideos.length > 0 && videoPauseStatus) {
      let timeWithNoVideo = closest(ts, nextVideos) - ts;

      const asyncFoo = async (ms) => {
        await new Promise((resolve) => setTimeout(resolve, ms));
        getVideoByTs(ts + ms + 1);
      };

      asyncFoo(timeWithNoVideo)

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

function hideAllVideos() {
  for (let i = 1; i < scene.children.length; i++) {
    scene.children[i].visible = false;
  }
}

function afficheVideo(videos, ts) {
  let videosElements = <HTMLVideoElement>document.getElementById(videos[0].id);

  let timeStartVideo: number = ts - videos[0].ts + videos[0].videoOffset;

  videosElements.currentTime = timeStartVideo / 1000;

  let ThreeObject = scene.getObjectByName(videos[0].id);

  hideAllVideos();

  ThreeObject.visible = true;

  if (videoPauseStatus && videosElements) {
    let playPromise = videosElements.play();

    if (playPromise !== undefined) {
      playPromise
        .then((_) => {
          console.log(
            'affiche vidéo promise play, ts départ vidéo',
            timeStartVideo
          );
          videosElements.currentTime = timeStartVideo / 1000;
          let videoPlayDuration =
            videos[0].videoOffset + videos[0].duration - timeStartVideo;
          console.log('temps de lecture de la vidéo', videoPlayDuration);
          timeouts.push(
            setTimeout(function () {
              getVideoByTs(ts + videoPlayDuration + 1);
              videosElements.pause();
            }, videoPlayDuration)
          );
        })
        .catch((error) => {
          console.log('play video error', error);
        });
    }
  }
}

document.getElementById('button').addEventListener('click', () => {
  let tsChange = Number(
    (<HTMLInputElement>document.getElementById('ts')).value
  );
  if (tsChange !== null) {
