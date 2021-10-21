import {
  Font,
  Mesh,
  TextGeometry,
  MeshBasicMaterial,
  Color,
  DoubleSide,
  Box3,
  Scene,
  Object3D,
} from 'three';

export default addSubtitles;

function addSubtitles(
  text: string,
  font: Font,
  scene: Scene,
  size: number,
  maxWidth: number,
  maxHeight: number
) {
  if (scene.getObjectByName('Subtitle')) {
    let objectToRemove: Object3D[] = [];
    for(let k = 0; k < scene.children.length; k += 1){
      if(scene.children[k].name === 'Subtitle'){
        objectToRemove.push(scene.children[k]);
      }
    }
    for(const object of objectToRemove){
      scene.remove(object);
    }
}

  let TextMesh: Mesh;

  SpliceText(text, size, font, maxWidth, scene);

  TextMesh = createTextMesh(text, size, font);
  const TBB = new Box3().setFromObject(TextMesh);
  TextMesh.position.set(-((TBB.max.x - TBB.min.x) / 2), maxHeight - 30, 10);
  TextMesh.rotation.set(Math.PI, 0, 0);

  TextMesh.name = 'Subtitle';

  return TextMesh;
}

function SpliceText(text: string, size: number, font: Font, maxWidth: number, scene: Scene) {
  if (!testWidthText(createTextMesh(text, size, font), maxWidth)) {
    let newTextArray: string[] = text.split(' ', 2);
    let newText: string = '';
    for (const textFor of newTextArray) {
      newText += textFor + ' ';
    }
    let i = 4;
    while (testWidthText(createTextMesh(newText, size, font), maxWidth)) {
      let newTextArrayWhile: string[] = text.split(' ', i);
      newText = '';
      for (const textFor of newTextArrayWhile) {
        newText += textFor + ' ';
      }
      i += 2;
    }
    for (let f = 0; f < text.split(' ').length / i; f++) {
      let textArray: string[] = text.split(' ').splice(f * i, i);
      let textToCreate: string = '';
      for (const txt of textArray) {
        textToCreate += txt + ' ';
      }
      const TextMesh = createTextMesh(textToCreate, size, font);
      const TBB = new Box3().setFromObject(TextMesh);
      TextMesh.position.set(
        -((TBB.max.x - TBB.min.x) / 2),
        540 + (f - text.split(' ').length / i) * (TBB.max.y - TBB.min.y),
        10
      );
      TextMesh.rotation.set(Math.PI, 0, 0);

      TextMesh.name = 'Subtitle'; // Changer sur le id du texte
      scene.add(TextMesh);
    }
  } else {
    const TextMesh = createTextMesh(text, size, font);
      const TBB = new Box3().setFromObject(TextMesh);
      TextMesh.position.set(
        -((TBB.max.x - TBB.min.x) / 2),
        540 - 30,
        10
      );
      TextMesh.rotation.set(Math.PI, 0, 0);

      TextMesh.name = 'Subtitle'; // Changer sur le id du texte
      scene.add(TextMesh);
  }
}
function testWidthText(mesh: Mesh, maxWidth: number) {
  const TBB = new Box3().setFromObject(mesh);
  if (TBB.max.x - TBB.min.x < maxWidth) {
    return true;
  } else {
    return false;
  }
}

function createTextMesh(text: string, size: number, font: Font) {
  const TextMesh = new Mesh(
    new TextGeometry(text, {
      size: 50 * size,
      height: 0,
      curveSegments: 6,
      font: font,
    }),
    new MeshBasicMaterial({
      color: new Color(),
      side: DoubleSide,
    })
  );

  return TextMesh;
}

/*
function SpliceText (text: string, size: number, font: Font, maxWidth: number, TextArray: string[], newTextArray: string[]) {
  if(!testWidthText(createTextMesh(text, size, font), maxWidth)){
    newTextArray = Array.from(TextArray);
    let newText: string = '';
    for(let textFor of newTextArray){
      newText += textFor + ' ';
    }
    while(!testWidthText(createTextMesh(newText, size, font), maxWidth)){
      newTextArray.pop();
      let newTextFor:string = '';
      for(let textFor of newTextArray){
        newTextFor += textFor + ' ';
      }
      newText = newTextFor;
    }
    console.log(newTextArray.length, TextArray, text);
    TextArray.splice(0, newTextArray.length);
    console.log(newTextArray.length, TextArray, text);
    const newArray = Array.from(newTextArray);
    SpliceText(newText, size, font, maxWidth, newArray, TextArray);
  } else {
    return;
  }
}*/
