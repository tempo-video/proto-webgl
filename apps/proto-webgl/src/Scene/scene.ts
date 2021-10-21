import { Scene, Color, OrthographicCamera} from 'three';

function SceneBuffer <scene>(videoWidth: number, videoHeight: number){
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

}

export {SceneBuffer}