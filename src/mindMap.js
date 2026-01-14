import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

export class MindMapLines {
  constructor() {
    this.lines = [];
    this.group = new THREE.Group();
    this.opacityTarget = 0;
    this.currentOpacity = 0;
  }

  init(panels, centerPanelIndex) {
    const centerPanel = panels[centerPanelIndex];
    if (!centerPanel) return this.group;

    panels.forEach((panel, index) => {
      if (index === centerPanelIndex) return;

      const geometry = new LineGeometry();
      geometry.setPositions([0, 0, 0, 0, 0, 0]);

      const material = new LineMaterial({
        color: 0xEE6C4D, // Reddish-orange color from Figma
        linewidth: 3, // Thicker line (in pixels)
        transparent: true,
        opacity: 0,
        depthWrite: false, // Don't write to depth buffer
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
      });

      const line = new Line2(geometry, material);
      line.computeLineDistances();
      line.renderOrder = -100; // Render first (behind panels)
      
      this.group.add(line);

      this.lines.push({
        line,
        panel,
        centerPanel
      });
    });

    // Handle window resize to update line material resolution
    window.addEventListener('resize', () => this.onResize());

    return this.group;
  }

  onResize() {
    this.lines.forEach((item) => {
      item.line.material.resolution.set(window.innerWidth, window.innerHeight);
    });
  }

  show() {
    this.opacityTarget = 0.85;
  }

  hide() {
    this.opacityTarget = 0;
  }

  update() {
    // Smoothly animate opacity
    this.currentOpacity += (this.opacityTarget - this.currentOpacity) * 0.08;

    this.lines.forEach((item) => {
      item.line.material.opacity = this.currentOpacity;
      
      if (this.currentOpacity > 0.01) {
        item.line.visible = true;
        
        // Update line endpoints to follow panel positions
        const start = item.centerPanel.mesh.position;
        const end = item.panel.mesh.position;
        
        // LineGeometry uses a flat array: [x1, y1, z1, x2, y2, z2]
        item.line.geometry.setPositions([
          start.x, start.y, start.z - 50, // Offset z to ensure behind panels
          end.x, end.y, end.z - 50
        ]);
      } else {
        item.line.visible = false;
      }
    });
  }

  getGroup() {
    return this.group;
  }
}
