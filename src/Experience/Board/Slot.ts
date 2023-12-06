import * as BABYLON from 'babylonjs'

import {Experience} from '../Experience'

export class Slot {
  experience
  slotPicker
  scene
  root

  constructor({
    name, // Should be unique
    width,
    height,
    position
  }: {
    name: string
    width: number
    height: number
    position: BABYLON.Vector3
  }) {
    this.experience = new Experience()
    this.slotPicker = this.experience.slotPicker
    this.scene = this.experience.scene
    this.root = BABYLON.MeshBuilder.CreatePlane(name, {width, height}, this.scene)
    const material = new BABYLON.StandardMaterial(name)
    material.diffuseTexture = new BABYLON.Texture('assets/images/slot.webp')
    this.root.material = material
    this.root.position.copyFrom(position)
    this.slotPicker.addMeshes([this.root])
  }
}