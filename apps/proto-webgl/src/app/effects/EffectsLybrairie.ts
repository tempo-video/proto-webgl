import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterImagePass';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

const BloomPassComp = new BloomPass(
  1, // strength
  25, // kernel size
  4, // sigma ?
  256 // blur render target resolution
);

const FilmPassComp = new FilmPass(
  0.35, // noise intensity
  0.025, // scanline intensity
  648, // scanline count
  0 // grayscale
);
FilmPassComp.renderToScreen = true;
//composer.addPass(filmPass);

let counter = 0.0;
let grainEffectShader = {
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
let GrainPassComp = new ShaderPass(grainEffectShader);
GrainPassComp.renderToScreen = true;

const GlitchPassComp = new GlitchPass();

const FantomePassComp = new AfterimagePass();

export {
  BloomPassComp,
  FilmPassComp,
  GlitchPassComp,
  FantomePassComp,
  GrainPassComp,
};
