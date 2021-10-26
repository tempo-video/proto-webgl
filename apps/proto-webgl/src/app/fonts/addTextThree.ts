import { LoadedFont } from '../../assets/interfaces/Interfaces';
import {
  TextGeometry,
  Color,
  MeshBasicMaterial,
  DoubleSide,
  Mesh,
} from 'three';

function TextLoader(
  textString: string,
  type: string,
  allFontsLoaded: LoadedFont[]
) {
  const fontIndex = allFontsLoaded.findIndex((element) => {
    return element.name === type;
  });
  const textGeo = new TextGeometry(textString, {
    size: 100,
    height: 0,
    curveSegments: 6,
    font: allFontsLoaded[fontIndex].font,
  });
  const color = new Color();
  color.setRGB(255, 255, 255);
  const textMaterial = new MeshBasicMaterial({
    color: color,
    side: DoubleSide,
  });
  const text = new Mesh(textGeo, textMaterial);
  text.name = type; // Changer sur le id du texte
  text.position.set(-200, 0, 0);
  text.rotation.set(Math.PI, 0 ,0);
  return text;
}

export { TextLoader };
