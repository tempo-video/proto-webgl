import {
  Font,
  Mesh,
  TextGeometry,
  MeshBasicMaterial,
  Color,
  DoubleSide,
  Box3,
  Scene,
} from 'three';

export default addSubtitles;

function addSubtitles(text: string, font: Font, scene: Scene, size: number, maxWidth : number, maxHeight: number) {

  if (scene.getObjectByName('Subtitle')) {
    scene.remove(<Scene>scene.getObjectByName('Subtitle'));
  }

  let TextMesh:Mesh;

  const TextsArrayGeometry: string[] = [];
  const TextArray = text.split(' ');


  const newTextArray = Array.from(TextArray);

  SpliceText(text, size,font,maxWidth, TextArray, newTextArray);
  

  /*
  if(!testWidthText(createTextMesh(text, size, font), maxWidth)){
    const newTextArray = Array.from(TextArray);
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
    TextMesh = createTextMesh(newText, size, font);
  } else {
    TextMesh = createTextMesh(text, size, font);
  }
  */

  /*if((TBB.max.x - TBB.min.x) > maxWidth){
    console.log('trop grand');
    const newText = text.split(' ');
    newText.pop();
    while()
    console.log(newText);
  }
  */
 TextMesh = createTextMesh(text, size, font);
 const TBB =new Box3().setFromObject(TextMesh);
  TextMesh.position.set(-((TBB.max.x - TBB.min.x) / 2), maxHeight - 30, 10);
  TextMesh.rotation.set(Math.PI, 0, 0);
  
  TextMesh.name = 'Subtitle'; // Changer sur le id du texte

  return TextMesh;
}

function SpliceText (text: string, size: number, font: Font, maxWidth: number, TextArray: string[], newTextArray: string[]) {
  if(!testWidthText(createTextMesh(text, size, font), maxWidth)){
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
    const newArray = Array.from(TextArray);
    SpliceText(newText, size, font, maxWidth, TextArray, newArray);
  } else {
    return;
  }
}
function testWidthText(mesh : Mesh, maxWidth : number) {
  const TBB = new Box3().setFromObject(mesh);
  if((TBB.max.x - TBB.min.x) < maxWidth){
    return true;
  } else {
    return false;
  }
}

function createTextMesh (text: string, size: number, font: Font) {
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
  )

  return TextMesh;
}