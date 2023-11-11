/*
import * as THREE from "three";

export default function createCubeGroup(game) {

  console.log(THREE);

  const [M,N] = [game.rank.M, game.rank.N];
  const sc = 1.2/M;
  const offM = Math.trunc(M/2);
  const offN = Math.trunc(N/2);
  const shrink = .25;
  const group = new THREE.Group();

  for (let k = 0; k < M; k++) {
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        const mat = new THREE.MeshPhongMaterial();
        mat.color.set(i / M, j / N, k / M);
        const geo = new THREE.BoxGeometry(sc, sc, sc);
        const mesh = new THREE.Mesh(geo, mat);

        //create letters by using normal maps
        //have one texture per letter - yikes
        mesh.position.set(
          (i - offM) * shrink,
          (j - offN) * shrink,
          (k - offM) * shrink
        );
        group.add(mesh);
      }
    }
  }

  return group;

}
*/