import { ShaderMaterial } from "three";

export const transitionShader: ShaderMaterial = new ShaderMaterial({

    uniforms: {

      tDiffuse1: {
        value: null
      },
      tDiffuse2: {
        value: null
      },
      mixRatio: {
        value: 0.0
      },
      threshold: {
        value: 0.1
      },
      useTexture: {
        value: 1,
      },
      tMixTexture: {
        value: null
      }
    },
    vertexShader: [

      "varying vec2 vUv;",

      "void main() {",

      "vUv = vec2( uv.x, uv.y );",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

      "}"

    ].join("\n"),
    fragmentShader: [

      "uniform float mixRatio;",

      "uniform sampler2D tDiffuse1;",
      "uniform sampler2D tDiffuse2;",
      "uniform sampler2D tMixTexture;",
      
      "uniform int useTexture;",
      "uniform float threshold;",

      "varying vec2 vUv;",

      "void main() {",

      "vec4 texel1 = texture2D( tDiffuse1, vUv );",
      "vec4 texel2 = texture2D( tDiffuse2, vUv );",
      
      "if (useTexture==1) {",
        
        "vec4 transitionTexel = texture2D( tMixTexture, vUv );",
        "float r = mixRatio * (1.0 + threshold * 2.0) - threshold;",
        "float mixf=clamp((transitionTexel.r - r)*(1.0/threshold), 0.0, 1.0);",
        
        "gl_FragColor = mix( texel1, texel2, mixf );",
      "} else {",
        
        "gl_FragColor = mix( texel2, texel1, mixRatio );",
        
      "}",
    "}"

    ].join("\n")

  })		