import { transitionShader } from '../transitions/transitions';
import { sceneBuffer } from '../../assets/interfaces/Interfaces';

async function pauseVideo(id: string) {
  if (id) {
    /*const videoObject = scene.getObjectByName(id);
    videoObject!.visible = false;*/

    const videoElement = <HTMLVideoElement>document.getElementById(id);
    await pauseVideoPromise(videoElement);
  }
}

function pauseVideoPromise(video: HTMLVideoElement) {
  return new Promise((resolve) => {
    resolve(video.pause());
  });
}

function playVideoPromise(video: HTMLVideoElement) {
  return new Promise((resolve) => {
    resolve(video.play());
  });
}

async function playVideo(id: string, start: number, Scenes: sceneBuffer[]) {
  const videoElement = <HTMLVideoElement>document.getElementById(id);

  await playVideoPromise(videoElement);
  videoElement.currentTime = start / 1000;

  const videoScene = Scenes.find((element) => element.id === id);

  transitionShader.uniforms.mixRatio.value = 0.0;
  transitionShader.uniforms.tDiffuse2.value = videoScene?.fbo.texture;
}

export { playVideo, pauseVideo };
