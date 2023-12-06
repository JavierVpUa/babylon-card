import * as BABYLON from 'babylonjs'

import {BOARD_ANGLE_FACTOR, GAP, LAYER_CARD_Z, LAYER_PICK_Z} from '../../utils/constants'

import {Experience} from '../Experience'

export class Card {
  experience
  raycast
  scene
  gameState
  mouse
  root
  back

  isPointerDown = false
  isPicked = false
  prevPos = new BABYLON.Vector3()
  prevRot = new BABYLON.Vector3()
  isAnimating = false

  constructor({
    name, // Should be unique
    width,
    height,
    position,
    backTextureUrl
  }: {
    name: string
    width: number
    height: number
    position: BABYLON.Vector3
    backTextureUrl: string
  }) {
    this.experience = new Experience()
    this.raycast = this.experience.raycast
    this.scene = this.experience.scene
    this.gameState = this.experience.gameState
    this.mouse = this.experience.mouse
    this.root = new BABYLON.TransformNode(name)
    this.root.position.copyFrom(position)
    this.root.rotation.y = Math.PI

    this.back = BABYLON.MeshBuilder.CreatePlane(name, {width, height, sideOrientation: 2}, this.scene)
    this.back.parent = this.root
    const material = new BABYLON.StandardMaterial(name)
    material.diffuseTexture = new BABYLON.Texture(backTextureUrl)
    this.back.material = material
    this.back.position.z = GAP / 2
    this.back.rotation.y = Math.PI

    this.mouse.on('pointerDown', async (root: BABYLON.Mesh) => {
      if (root.name === name && !this.isAnimating) {
        this.isAnimating = true

        switch (this.gameState.step) {
        case 'select':
          this.experience.board.cards.root.setEnabled(false)
          await this.animSelect()
          this.gameState.step = 'play'
          break
        case 'play':
          if (this.isPicked) {
            this.prevPos.copyFrom(this.root.position)
            this.prevRot.copyFrom(this.root.rotation)
            this.isPointerDown = true
          } else {
            await this.animPick()
            this.isPicked = true
          }
          break
        }

        this.isAnimating = false
      }
    })

    this.mouse.on('pointerMove', (root: BABYLON.Mesh, diff: BABYLON.Vector3) => {
      if (root.name === name && this.isPointerDown && this.gameState.step === 'play') {
        this.root.position.addInPlace(diff)
      }
    })

    this.mouse.on('pointerUp', async () => {
      if (this.isPointerDown && !this.isAnimating) {
        this.isAnimating = true
        const pickedMesh = this.raycast.getPickedMesh()

        if (pickedMesh) {
          await this.animDrop(pickedMesh)
        } else {
          await this.animToPrev()
        }
      }

      this.isPointerDown = false
      this.isAnimating = false
    })
  }

  async animSelect() {
    this.root.setParent(this.experience.board.root)
    const bottomRightSlotPos = this.experience.board.bottomRightSlot.root.position

    const animZoomInPos = new BABYLON.Animation('animZoomInPos', 'position', 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)
    animZoomInPos.setKeys([
      {
        frame: 0,
        value: this.root.position.clone()
      },
      {
        frame: 10,
        value: new BABYLON.Vector3(0, -3, -3)
      },
      {
        frame: 20,
        value: new BABYLON.Vector3(0, -3, -3)
      },
      {
        frame: 40,
        value: new BABYLON.Vector3(bottomRightSlotPos.x, bottomRightSlotPos.y, LAYER_CARD_Z)
      },
    ])

    const animZoomInRot = new BABYLON.Animation('animZoomInPos', 'rotation', 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)
    animZoomInRot.setKeys([
      {
        frame: 0,
        value: this.root.rotation.clone()
      },
      {
        frame: 10,
        value: new BABYLON.Vector3(0, Math.PI, 0)
      },
    ])

    this.root.animations = [animZoomInPos, animZoomInRot]
    await this.scene.beginAnimation(this.root, 0, 40, false).waitAsync()
  }

  async animPick() {
    this.root.setParent(this.experience.board.root)
    this.root.position.set(0, -2.35, LAYER_PICK_Z)
    this.root.rotation.set(Math.PI * BOARD_ANGLE_FACTOR, Math.PI, 0)
    const scale = 1.3
    this.root.scaling.set(scale, scale, scale)
  }

  async animDrop(pickedMesh: BABYLON.AbstractMesh) {
    this.root.setParent(this.experience.board.root)
    this.root.position.set(pickedMesh.position.x, pickedMesh.position.y, LAYER_CARD_Z)
    this.root.rotation.copyFrom(pickedMesh.rotation)
    const scale = 1
    this.root.scaling.set(scale, scale, scale)
  }

  async animToPrev() {
    this.root.position.copyFrom(this.prevPos)
    this.root.rotation.copyFrom(this.prevRot)
  }
}