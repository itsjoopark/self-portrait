import * as THREE from 'three';
import { SpringVector3 } from './springPhysics.js';

// Constants for panel configuration - smoother transitions
const STIFFNESS_CENTER = 0.04;
const STIFFNESS_EDGE = 0.02;
const DAMPING = 0.92;

export class PanelGrid {
  constructor(videoTexture, webcamAspect) {
    this.panels = [];
    this.group = new THREE.Group();
    this.videoTexture = videoTexture;
    this.webcamAspect = webcamAspect;
  }

  createFacePanelLayout() {
    // Define purposeful panels mapped to facial features
    // Distributed across z-depth for 3D parallax effect
    // Background: z = -30 to -50, Mid: z = 0 to 20, Foreground: z = 40 to 80
    
    const panels = [
      // ============ FOREHEAD (5 panels) ============
      { id: 'forehead-left', x: -55, y: 190, w: 110, h: 75, uvRect: [0.38, 0.60, 0.52, 0.72], z: 5 },
      { id: 'forehead-right', x: 65, y: 195, w: 100, h: 70, uvRect: [0.48, 0.61, 0.62, 0.73], z: 8 },
      { id: 'forehead-top', x: 5, y: 230, w: 90, h: 50, uvRect: [0.43, 0.72, 0.57, 0.82], z: -35 },
      { id: 'forehead-far-left', x: -140, y: 180, w: 70, h: 60, uvRect: [0.32, 0.62, 0.42, 0.72], z: -40 },
      { id: 'forehead-far-right', x: 145, y: 175, w: 65, h: 55, uvRect: [0.58, 0.62, 0.68, 0.72], z: -38 },
      
      // ============ EYEBROWS (2 panels) ============
      { id: 'eyebrow-left', x: -85, y: 145, w: 95, h: 35, uvRect: [0.50, 0.56, 0.68, 0.64], z: 45 },
      { id: 'eyebrow-right', x: 75, y: 140, w: 90, h: 35, uvRect: [0.32, 0.55, 0.50, 0.63], z: 42 },
      
      // ============ EYES (3 panels) ============
      { id: 'eye-left', x: -110, y: 90, w: 130, h: 95, uvRect: [0.52, 0.44, 0.72, 0.58], z: 55 },
      { id: 'eye-right', x: 100, y: 85, w: 125, h: 90, uvRect: [0.28, 0.43, 0.48, 0.57], z: 50 },
      { id: 'nose-bridge', x: -5, y: 100, w: 65, h: 75, uvRect: [0.45, 0.46, 0.55, 0.58], z: 60 },
      
      // ============ TEMPLES (3 panels) ============
      { id: 'temple-left', x: -215, y: 110, w: 70, h: 95, uvRect: [0.75, 0.48, 0.88, 0.62], z: -45 },
      { id: 'temple-right', x: 210, y: 105, w: 65, h: 90, uvRect: [0.12, 0.47, 0.25, 0.61], z: -42 },
      { id: 'temple-upper-left', x: -195, y: 170, w: 60, h: 70, uvRect: [0.72, 0.58, 0.84, 0.70], z: -50 },
      
      // ============ NOSE (2 panels) ============
      { id: 'nose-tip', x: -5, y: 10, w: 110, h: 120, uvRect: [0.42, 0.25, 0.58, 0.45], z: 75 },
      { id: 'nose-side', x: -50, y: 40, w: 50, h: 70, uvRect: [0.52, 0.32, 0.62, 0.46], z: 40 },
      
      // ============ CHEEKS (6 panels) ============
      { id: 'cheek-upper-left', x: -180, y: 60, w: 100, h: 105, uvRect: [0.65, 0.40, 0.82, 0.55], z: -30 },
      { id: 'cheek-lower-left', x: -175, y: -50, w: 95, h: 100, uvRect: [0.68, 0.22, 0.85, 0.40], z: -35 },
      { id: 'cheek-upper-right', x: 170, y: 55, w: 95, h: 100, uvRect: [0.18, 0.38, 0.35, 0.53], z: -32 },
      { id: 'cheek-lower-right', x: 180, y: -60, w: 90, h: 95, uvRect: [0.15, 0.20, 0.32, 0.38], z: -38 },
      { id: 'cheek-mid-left', x: -155, y: 5, w: 80, h: 85, uvRect: [0.66, 0.30, 0.80, 0.44], z: 10 },
      { id: 'cheek-mid-right', x: 150, y: 0, w: 75, h: 80, uvRect: [0.20, 0.29, 0.34, 0.43], z: 8 },
      
      // ============ MOUTH (4 panels) ============
      { id: 'mouth-left', x: -60, y: -90, w: 105, h: 80, uvRect: [0.48, 0.14, 0.65, 0.28], z: 48 },
      { id: 'mouth-right', x: 55, y: -95, w: 100, h: 75, uvRect: [0.35, 0.13, 0.52, 0.27], z: 45 },
      { id: 'upper-lip', x: 0, y: -65, w: 80, h: 40, uvRect: [0.42, 0.22, 0.58, 0.30], z: 65 },
      { id: 'lower-lip', x: 5, y: -115, w: 75, h: 35, uvRect: [0.43, 0.10, 0.57, 0.18], z: 58 },
      
      // ============ CHIN & JAW (5 panels) ============
      { id: 'chin-center', x: -15, y: -175, w: 120, h: 80, uvRect: [0.40, 0.02, 0.60, 0.15], z: 30 },
      { id: 'chin-left', x: -110, y: -165, w: 80, h: 70, uvRect: [0.58, 0.05, 0.72, 0.18], z: 15 },
      { id: 'chin-right', x: 95, y: -170, w: 85, h: 75, uvRect: [0.28, 0.04, 0.42, 0.17], z: 18 },
      { id: 'jaw-left', x: -165, y: -120, w: 70, h: 80, uvRect: [0.65, 0.12, 0.78, 0.26], z: -25 },
      { id: 'jaw-right', x: 160, y: -125, w: 65, h: 75, uvRect: [0.22, 0.11, 0.35, 0.25], z: -28 },
      
      // ============ NECK & COLLAR (3 panels) ============
      { id: 'neck-center', x: 0, y: -240, w: 100, h: 60, uvRect: [0.42, -0.05, 0.58, 0.05], z: -40 },
      { id: 'neck-left', x: -80, y: -230, w: 70, h: 55, uvRect: [0.55, -0.03, 0.68, 0.07], z: -45 },
      { id: 'neck-right', x: 75, y: -235, w: 65, h: 50, uvRect: [0.32, -0.04, 0.45, 0.06], z: -48 },
    ];
    
    return panels;
  }

  init() {
    const facePanels = this.createFacePanelLayout();
    
    // Calculate mind map positions
    const centerPanelIdx = facePanels.findIndex(p => p.id === 'nose-tip');
    const others = facePanels.filter((_, i) => i !== centerPanelIdx);
    
    facePanels.forEach((def, index) => {
      // Calculate mind map position for this panel
      let mindMapPos;
      
      if (def.id === 'nose-tip') {
        mindMapPos = new THREE.Vector3(0, 0, 0);
      } else {
        const othersIdx = others.findIndex(p => p.id === def.id);
        const angle = (othersIdx / others.length) * Math.PI * 2;
        // Vary radius based on original z-depth for layered explosion
        const baseRadius = 280 + (def.z > 30 ? 40 : def.z < -20 ? -30 : 0);
        const radius = baseRadius + Math.random() * 80;
        mindMapPos = new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          def.z * 0.8 + (Math.random() - 0.5) * 60
        );
      }

      const panel = this.createFacePanel(def, index, mindMapPos);
      this.panels.push(panel);
      this.group.add(panel.mesh);
    });

    return this.group;
  }

  createFacePanel(def, index, mindMapPos) {
    const geometry = new THREE.PlaneGeometry(def.w, def.h);

    const [u0, v0, u1, v1] = def.uvRect;
    
    const uvs = geometry.attributes.uv;
    uvs.setXY(0, u0, v1); // top-left
    uvs.setXY(1, u1, v1); // top-right
    uvs.setXY(2, u0, v0); // bottom-left
    uvs.setXY(3, u1, v0); // bottom-right
    uvs.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      side: THREE.FrontSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(def.x, def.y, def.z);
    mesh.renderOrder = 1; // Render on top of lines

    const distFromCenter = Math.sqrt(def.x * def.x + def.y * def.y);
    const maxDist = 250;
    const normalizedDist = Math.min(distFromCenter / maxDist, 1);
    const stiffness = STIFFNESS_CENTER + (STIFFNESS_EDGE - STIFFNESS_CENTER) * normalizedDist;

    const spring = new SpringVector3(
      new THREE.Vector3(def.x, def.y, def.z),
      stiffness,
      DAMPING
    );

    return {
      id: def.id,
      mesh,
      spring,
      facePosition: new THREE.Vector3(def.x, def.y, def.z),
      mindMapPosition: mindMapPos,
      distFromCenter: normalizedDist,
      zDepth: def.z,
      index,
      isDragging: false,
      dragPosition: new THREE.Vector2(0, 0)
    };
  }

  update(faceData, time, state) {
    const { position, rotation, detected } = faceData;

    this.panels.forEach((panel) => {
      let targetX, targetY, targetZ;
      
      if (state === 'face') {
        targetX = panel.facePosition.x;
        targetY = panel.facePosition.y;
        targetZ = panel.facePosition.z;

        if (detected) {
          const moveScale = 70;
          const parallaxFactor = 1 + (panel.zDepth * 0.012);
          
          targetX += position.x * moveScale * parallaxFactor;
          targetY += position.y * moveScale * parallaxFactor;
          
          const rotScale = 30;
          targetX += rotation.yaw * rotScale * parallaxFactor;
          targetY += rotation.pitch * rotScale * parallaxFactor;
          
          targetZ += rotation.roll * 10;
        }
      } else {
        // Mind map state - check if being dragged
        if (panel.isDragging) {
          targetX = panel.dragPosition.x;
          targetY = panel.dragPosition.y;
          targetZ = panel.mindMapPosition.z;
        } else {
          targetX = panel.mindMapPosition.x;
          targetY = panel.mindMapPosition.y;
          targetZ = panel.mindMapPosition.z;
          
          // Dynamic floating in mind map state (increased movement)
          const floatSpeed = 0.7;
          const floatAmp = 30;
          targetX += Math.sin(time * floatSpeed + panel.index) * floatAmp;
          targetY += Math.cos(time * floatSpeed * 0.8 + panel.index * 1.3) * floatAmp;
          targetZ += Math.sin(time * floatSpeed * 0.5 + panel.index * 0.7) * 15;
        }
      }

      // Idle floating (applied to both but more subtle in face mode)
      const idleAmplitude = state === 'face' ? (detected ? 1.0 : 2.5) : 5;
      const idleSpeed = 0.35;
      const phaseOffset = panel.index * 0.25;
      
      targetX += Math.sin(time * idleSpeed + phaseOffset) * idleAmplitude;
      targetY += Math.cos(time * idleSpeed * 0.7 + phaseOffset * 1.2) * idleAmplitude;

      panel.spring.setTarget(targetX, targetY, targetZ);
      const newPos = panel.spring.update();
      panel.mesh.position.copy(newPos);
    });
  }

  getGroup() {
    return this.group;
  }

  getPanels() {
    return this.panels;
  }

  getCenterPanelIndex() {
    return this.panels.findIndex(p => p.id === 'nose-tip');
  }

  setDragPosition(panelIndex, worldX, worldY) {
    if (panelIndex >= 0 && panelIndex < this.panels.length) {
      const panel = this.panels[panelIndex];
      panel.isDragging = true;
      panel.dragPosition.set(worldX, worldY);
    }
  }

  releaseDrag(panelIndex) {
    if (panelIndex >= 0 && panelIndex < this.panels.length) {
      const panel = this.panels[panelIndex];
      panel.isDragging = false;
      // Spring will naturally bounce it back to mindMapPosition
    }
  }
}
