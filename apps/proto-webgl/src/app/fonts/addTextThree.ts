import { LoadedFont } from '../../assets/interfaces/Interfaces';
import {
  TextGeometry,
  Color,
  MeshBasicMaterial,
  DoubleSide,
  Mesh,
  Object3D,
  Plane,
  Vector3,
  Group,
} from 'three';

export const localPlanes = [
  new Plane(new Vector3(0, -1, 0), 0),
  new Plane(new Vector3(-1, 0, 0), 0.1),
];

function TextLoader(
  textString: string,
  type: string,
  allFontsLoaded: LoadedFont[]
) {
  let lines = textString.split('\n');
  let letters = textString.split('');

  let linesL: string[][] = [];
  let index = 0;
  letters.forEach((element) => {
    if (element === '\n') {
      index++;
    } else {
      if (!linesL[index]) {
        linesL.push([]);
      }
      linesL[index].push(element);
    }
  });
  console.log(linesL);

  const textGroup = new Group();
  linesL.forEach(element => {
    const lineGroup = new Group();
    element.forEach(elem => {
      const fontIndex = allFontsLoaded.findIndex((element) => {
        return element.name === type;
      });
      const textGeo = new TextGeometry(elem, {
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
      text.name = elem; // Changer sur le id du texte
      text.position.set(-200, 0, 0);
      text.rotation.set(Math.PI, 0, 0);
      lineGroup.add(text);
    })
    textGroup.add(lineGroup);
  })


  console.log(textGroup);

  return textGroup;
}

export { TextLoader };
