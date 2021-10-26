import { Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, CircleGeometry } from 'three';
import { transformShape } from './transformShape';
import { shapeInfos } from '../../assets/interfaces/Interfaces';

function addShapeThree(shapeInfos: shapeInfos) {
    switch (shapeInfos.id) {
      case 'square':
        const square = new Mesh(
          new PlaneGeometry(shapeInfos.width, shapeInfos.height),
          new MeshBasicMaterial({
            color: 0xff0f00,
            side: DoubleSide,
          })
        );
        transformShape(square, shapeInfos);
        return {
          element: square,
          name: shapeInfos.name,
          visibility: false,
        };
      case 'circle':
        const circle = new Mesh(
          new CircleGeometry(shapeInfos.width, 32),
          new MeshBasicMaterial({
            color: 0xfffff0,
            side: DoubleSide,
          })
        );
        transformShape(circle, shapeInfos);
        return {
          element: circle,
          name: shapeInfos.name,
          visibility: false,
        };
    }
  }

  export { addShapeThree }