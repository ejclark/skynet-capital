import * as THREE from "three";

/**
 * The MERGE BUCKET — how thousands of stones become ~20 draw calls. The design handoff's own
 * `add()/flush()` pattern: every builder queues geometry with a transform, and nothing becomes a
 * mesh until `flush` bakes one per (part, material). Part names survive as mesh names, so the tower
 * still exports and inspects as `massif`, `fortress`, `shaft-fins`, `horn-left`…
 *
 * Only positions and normals are kept — all these materials read — which is also what lets
 * primitives and hand-built shapes share a batch without an attribute mismatch.
 */

export type MatKey = "rock" | "basalt" | "iron" | "ember";
export type Vec3 = readonly [number, number, number];

const EULER = new THREE.Euler();
const QUAT = new THREE.Quaternion();

export class Bucket {
  private readonly batches = new Map<string, THREE.BufferGeometry[]>();

  /**
   * Queue `geo` under `part` with material `mat`. Rotation is Euler `[x, y, z]` in 'YXZ' order, as
   * in the reference, so its numbers port verbatim. The geometry is consumed (cloned, not shared).
   */
  add(
    part: string,
    mat: MatKey,
    geo: THREE.BufferGeometry,
    pos: Vec3 = [0, 0, 0],
    rot: Vec3 = [0, 0, 0],
    scl: Vec3 = [1, 1, 1],
  ): void {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...pos),
      QUAT.setFromEuler(EULER.set(rot[0], rot[1], rot[2], "YXZ")),
      new THREE.Vector3(...scl),
    );
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(m);
    const key = `${part}|${mat}`;
    const list = this.batches.get(key) ?? [];
    list.push(g);
    this.batches.set(key, list);
    geo.dispose();
  }

  /** Bake every batch into one mesh per (part, material), add them to `group`, and empty. */
  flush(group: THREE.Group, materials: Record<MatKey, THREE.Material>): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    for (const [key, list] of this.batches) {
      const [part = "part", mat = "basalt"] = key.split("|");
      let n = 0;
      for (const g of list) n += g.attributes.position?.count ?? 0;
      const P = new Float32Array(n * 3);
      const N = new Float32Array(n * 3);
      let o = 0;
      for (const g of list) {
        const pos = g.attributes.position as THREE.BufferAttribute;
        P.set(pos.array as Float32Array, o * 3);
        N.set((g.attributes.normal as THREE.BufferAttribute).array as Float32Array, o * 3);
        o += pos.count;
        g.dispose();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(N, 3));
      const mesh = new THREE.Mesh(geo, materials[mat as MatKey]);
      mesh.name = part;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      out.push(mesh);
    }
    this.batches.clear();
    return out;
  }
}
