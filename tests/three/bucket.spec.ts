import * as THREE from "three";
import { Bucket } from "../../src/three/kit/bucket.js";

/**
 * The merge bucket is the tower's draw-call budget: thousands of queued stones must come out as one
 * mesh per (part, material), with every queued transform baked in. No GPU needed — three.js
 * geometry is plain arrays.
 */
describe("Bucket", () => {
  const materials = {
    rock: new THREE.MeshBasicMaterial(),
    basalt: new THREE.MeshBasicMaterial(),
    iron: new THREE.MeshBasicMaterial(),
    ember: new THREE.MeshBasicMaterial(),
  };

  it("merges everything queued under one part and material into a single mesh", () => {
    const b = new Bucket();
    for (let i = 0; i < 50; i++) b.add("fortress", "basalt", new THREE.BoxGeometry(1, 1, 1));
    const meshes = b.flush(new THREE.Group(), materials);
    expect(meshes).toHaveLength(1);
    // 12 triangles per box, de-indexed.
    expect(meshes[0]?.geometry.attributes.position?.count).toBe(50 * 36);
  });

  it("keeps parts and materials apart, named after the part", () => {
    const b = new Bucket();
    b.add("fortress", "basalt", new THREE.BoxGeometry(1, 1, 1));
    b.add("fortress", "iron", new THREE.ConeGeometry(1, 2, 7));
    b.add("windows", "ember", new THREE.BoxGeometry(1, 1, 1));
    const group = new THREE.Group();
    const meshes = b.flush(group, materials);
    expect(meshes.map((m) => m.name).sort()).toEqual(["fortress", "fortress", "windows"]);
    expect(meshes.find((m) => m.name === "windows")?.material).toBe(materials.ember);
    expect(group.children).toHaveLength(3);
  });

  it("bakes the queued position, rotation and scale into the vertices", () => {
    const b = new Bucket();
    b.add("p", "rock", new THREE.BoxGeometry(2, 2, 2), [10, 0, 0], [0, 0, 0], [3, 1, 1]);
    const [mesh] = b.flush(new THREE.Group(), materials);
    mesh?.geometry.computeBoundingBox();
    const box = mesh?.geometry.boundingBox;
    expect(box?.min.x).toBeCloseTo(7);
    expect(box?.max.x).toBeCloseTo(13);
  });

  it("empties itself on flush, so a second flush adds nothing", () => {
    const b = new Bucket();
    b.add("p", "rock", new THREE.BoxGeometry(1, 1, 1));
    b.flush(new THREE.Group(), materials);
    expect(b.flush(new THREE.Group(), materials)).toHaveLength(0);
  });
});
