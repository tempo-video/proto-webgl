import {
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  Color,
  DoubleSide,
} from 'three';
import { LoadedTexture, shapeInfos } from '../../assets/interfaces/Interfaces';
import { transformShape } from '../shapes/transformShape';

function addBrandThree(
  brandInfos: shapeInfos,
  allTextureLoaded: LoadedTexture[]
) {
  const loadedtexture = allTextureLoaded.find(
    (element) => element.id === brandInfos.id
  );
  const texture = loadedtexture!.texture;
  const plane = new Mesh(
    new PlaneGeometry(brandInfos.width, brandInfos.height),
    new MeshBasicMaterial({
      color: new Color(),
      map: texture,
      side: DoubleSide,
    })
  );
  transformShape(plane, brandInfos);
  return { element: plane, name: brandInfos.name, visibility: false };
}

export { addBrandThree };
