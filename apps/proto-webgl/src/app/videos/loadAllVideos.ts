import { fromEvent } from "rxjs";
import { videosInfos} from '../../assets/interfaces/Interfaces';

async function getAllVideos(IdsVideo: string[], videosInfos: videosInfos[]) {
  IdsVideo.map((id) => createVideoHtmlElement(id, videosInfos));
}

async function createVideoHtmlElement(id: string, videosInfos: videosInfos[]) {
  const video = document.createElement('video');
  video.id = id;
  const videoSrc = videosInfos.find((element) => element.id == id);
  video.src = '../assets/videos/' + videoSrc!.videoId + '.mp4';
  document.getElementById('videos')!.appendChild(video);

  await videoLoading(video);
}

function videoLoading(video: HTMLVideoElement) {
  return new Promise<void>((resolve, _reject) => {
    fromEvent(video, 'loadeddata').subscribe(() => resolve());
  });
}

export { getAllVideos };
