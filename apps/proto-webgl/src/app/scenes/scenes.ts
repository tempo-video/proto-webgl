import {
  Scene,
  Color,
  OrthographicCamera,
  WebGLRenderTarget,
  LinearFilter,
  RGBFormat,
  WebGLRenderer,
  Clock,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';

import * as data from '../../assets/editor-state.json';

const editor = data.editor;
const videoWidth = editor.videoWidth;
const videoHeight = editor.videoHeight;

function SceneBuffer(renderer: WebGLRenderer, VideoID: string) {
  const clock = new Clock;

  const scene = new Scene();
  scene.background = new Color(0xffffff);

  const camera = new OrthographicCamera(
    videoWidth / -2,
    videoWidth / 2,
    videoHeight / -2,
    videoHeight / 2,
    -200,
    100
  );

  scene.add(camera);

  const renderTargetParameters = {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    format: RGBFormat,
    stencilBuffer: false,
  };

  const fbo = new WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    renderTargetParameters
  );

  const composer = new EffectComposer(renderer, fbo);
  composer.renderToScreen = false;

  const render = () => {
    const dt = clock.getElapsedTime();
    composer.render(dt);

    // -> Without composer
    /*
    renderer.setRenderTarget(fbo);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    */

  };

  ////////////////////////////////////////////////////////////
  ///////////////////Exemple effet associé////////////////////
  ////////////////////////////////////////////////////////////

  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new GlitchPass);

  ////////////////////////////////////////////////////////////

  return { render: render, fbo: fbo, scene: scene, id: VideoID, composer: composer };
}

export { SceneBuffer };