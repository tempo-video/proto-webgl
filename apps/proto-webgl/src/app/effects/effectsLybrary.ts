import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterImagePass';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { AdaptiveToneMappingPass } from 'three/examples/jsm/postprocessing/AdaptiveToneMappingPass';
import { BokehPass, BokehPassParamters } from 'three/examples/jsm/postprocessing/BokehPass';
import { KaleidoShader } from 'three/examples/jsm/shaders/KaleidoShader';
import { Camera, Scene } from 'three';

const BloomPassComp = new BloomPass();

const FilmPassComp = new FilmPass(
  0.35, // noise intensity
  0.025, // scanline intensity
  648, // scanline count
  0 // grayscale
);
FilmPassComp.renderToScreen = true;

let counter = 0.0;
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
    }
  
    void main() {
  
      vec4 color = texture2D( tDiffuse, vUv );
      vec2 uvRandom = vUv;
      uvRandom.y *= random(vec2(uvRandom.y,amount));
      color.rgb += random(uvRandom)*0.25;
      gl_FragColor = vec4( color  );
    }`,
};
const GrainPassComp = new ShaderPass(grainEffectShader);
GrainPassComp.renderToScreen = true;

const GlitchPassComp = new GlitchPass();

const FantomePassComp = new AfterimagePass();

const AdaptivePassComp = new AdaptiveToneMappingPass();

const KaleidoUni = KaleidoShader;
KaleidoUni.uniforms.angle.value = 10;
KaleidoUni.uniforms.sides.value = 5;

const KaleidoPassComp = new ShaderPass(KaleidoUni);

const BokehPassComp = function (scene: Scene, camera: Camera, bokehparams: BokehPassParamters){
    return new BokehPass(scene, camera, bokehparams);
}

export {
  BloomPassComp,
  FilmPassComp,
  GlitchPassComp,
  FantomePassComp,
  GrainPassComp,
  AdaptivePassComp,
  BokehPassComp,
  KaleidoPassComp
};