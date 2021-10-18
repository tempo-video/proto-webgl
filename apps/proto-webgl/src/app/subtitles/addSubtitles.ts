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
  TextMesh.name = 'Subtitle'; // Changer sur le id du texte
  const TBB = new Box3().setFromObject(TextMesh);
  console.log(TBB);
  TextMesh.position.set(-((TBB.max.x - TBB.min.x) / 2), maxHeight - 30, 10);
  TextMesh.rotation.set(Math.PI, 0, 0);

  return TextMesh;
}
