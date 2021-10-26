import { Mesh } from 'three';
import { shapeInfos } from '../../assets/interfaces/Interfaces';

function transformShape(shapeElement: Mesh, element: shapeInfos) {
  shapeElement.position.set(
    element.transform.translation.x,
    element.transform.translation.y,
    element.depth
  );
  shapeElement.rotation.set(
    element.transform.rotation.x,
    element.transform.rotation.y,
    element.transform.rotation.z
  );
  shapeElement.scale.set(
    element.transform.scale.x,
    element.transform.scale.y,
    element.transform.scale.z
  );
}

export { transformShape };
