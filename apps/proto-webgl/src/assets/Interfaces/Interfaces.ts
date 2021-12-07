import { Texture, Font, Mesh, WebGLRenderTarget, Scene } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

export interface LoadedTexture {
  id: string;
  texture: Texture;
}

export interface LoadedFont {
  name: string;
  url: string;
  font: Font;
}

export interface Transform {
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

export interface effect {
  name: string;
  effect: any;
  visibility: boolean;
}

export interface shapeInfos extends Transform {
  categoryId: string;
  name: string;
  id: string;
  width: number;
  height: number;
  depth: number;
}

export interface element {
  element: Mesh;
  name: string;
  visibility: boolean;
}

export interface sceneBuffer {
  scene: Scene;
  fbo: WebGLRenderTarget;
  render: () => void;
  id: string;
  composer: EffectComposer;
}

export interface videosInfos extends Transform {
  id: string;
  ts: number;
  type: string;
  videoId: string;
  videoOffset: number;
}

export interface dataInterface {
  audioCategories: never[];
  audioModels: never[];
  audioMuted: boolean;
  audioVolume: number;
  clipboard: {
    mode: string;
    items: never[];
  };
  elementCategories: {
    icon: string;
    id: string;
    modelIds: string[];
  }[];
  elementModels: elementModel[];
  frameIndex: number,
  fullScreen: boolean,
  loading: boolean,
  playbackPaused: boolean,
  playbackScale: number,
  playbackSpeed: number,
  sceneIndex: number,
  selectedTrackItemIds: string[],
  textModels: {
    id: string;
    nameId: string;
    url: string;
    style: {
      fontFamily: string;
      fontSize: string;
      fontStyle: string;
      fontWeight: string;
      textColor: string;
      textTransform: string;
      textDecoration?: {
        line: string;
        style: string;
        color: string;
        thickness: number;
      }
    }
  }[];
  timelineScale: number;
  tracks: {
    type: string;
    id: string;
    label: string;
    itemIds: string[];
  }[];
  trackItems: trackItem[];
  trackOrder: string[];
  videoAspect: string;
  videoBackground: string;
  videoHeight: number;
  videoWidth: number;
  videoLoading: boolean;
  playbackDuration: number;
  playbackPosition: number;
}

export interface elementModel extends Transform{
  categoryId: string;
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
}

export interface trackItem extends Transform {
  duration: number;
  id: string;
  ts: number;
  type: string;
  videoId: string;
  videoOffset: number;
}

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
