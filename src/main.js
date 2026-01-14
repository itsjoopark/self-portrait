import * as THREE from 'three';
import { WebcamTexture } from './webcam.js';
import { FaceTracker } from './faceTracker.js';
import { PanelGrid } from './panelGrid.js';
import { MindMapLines } from './mindMap.js';

class App {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.webcam = null;
    this.faceTracker = null;
    this.panelGrid = null;
    this.mindMapLines = null;
    this.clock = new THREE.Clock();
    this.faceData = {
      detected: false,
      position: { x: 0, y: 0, z: 0 },
      rotation: { yaw: 0, pitch: 0, roll: 0 }
    };
    this.demoMode = false;
    this.state = 'face'; // 'face' or 'mindMap'
    this.zoomLevel = 1;
    this.baseFrustumSize = 600;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.draggedPanelIndex = -1;
  }

  async init() {
    // Set up Three.js scene
    this.setupScene();
    
    try {
      // Initialize webcam
      this.webcam = new WebcamTexture();
      await this.webcam.init();
      
      // Create panel grid with webcam texture
      this.panelGrid = new PanelGrid(
        this.webcam.getTexture(),
        this.webcam.getAspect()
      );
      const panelGroup = this.panelGrid.init();
      this.scene.add(panelGroup);

      // Create mind map lines
      this.mindMapLines = new MindMapLines();
      const linesGroup = this.mindMapLines.init(
        this.panelGrid.getPanels(),
        this.panelGrid.getCenterPanelIndex()
      );
      this.scene.add(linesGroup);

      // Initialize face tracker
      this.faceTracker = new FaceTracker();
      this.faceTracker.setOnResultsCallback((data) => {
        this.faceData = data;
      });
      await this.faceTracker.init(this.webcam.getVideo());

      // Hide loading screen
      document.getElementById('loading').classList.add('hidden');
      
    } catch (error) {
      console.warn('Camera not available, running in demo mode:', error);
      this.demoMode = true;
      
      // Create demo texture
      const demoTexture = this.createDemoTexture();
      
      // Create panel grid with demo texture
      this.panelGrid = new PanelGrid(demoTexture, 4/3);
      const panelGroup = this.panelGrid.init();
      this.scene.add(panelGroup);

      // Create mind map lines for demo
      this.mindMapLines = new MindMapLines();
      const linesGroup = this.mindMapLines.init(
        this.panelGrid.getPanels(),
        this.panelGrid.getCenterPanelIndex()
      );
      this.scene.add(linesGroup);
      
      // Update loading message
      const loading = document.getElementById('loading');
      loading.innerHTML = `
        <p style="color: #333;">Demo Mode</p>
        <p class="hint" style="color: #555;">Move your mouse to interact</p>
        <p class="hint" style="color: #555; margin-top: 4px;">Press SPACE to toggle Mind Map</p>
      `;
      
      // Setup mouse tracking for demo mode
      this.setupMouseTracking();
      
      // Hide loading after brief delay
      setTimeout(() => {
        loading.classList.add('hidden');
      }, 3000);
    }

    // Handle window resize
    window.addEventListener('resize', () => this.onResize());

    // Handle space bar toggle
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.toggleState();
      }
    });

    // Trackpad zoom
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoomLevel = Math.max(0.4, Math.min(2.5, this.zoomLevel + e.deltaY * 0.001));
      this.updateCameraZoom();
    }, { passive: false });

    // Click to screenshot
    const canvas = document.getElementById('canvas');
    canvas.addEventListener('click', (e) => {
      // Only screenshot if not dragging
      if (!this.isDragging && this.state === 'face') {
        this.saveScreenshot();
      }
    });

    // Panel dragging in mind map mode
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseleave', () => this.onMouseUp());

    // Start animation loop
    this.animate();
  }

  updateCameraZoom() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = this.baseFrustumSize / this.zoomLevel;

    this.camera.left = -frustumSize * aspect / 2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();
  }

  saveScreenshot() {
    // Render one frame to ensure canvas is up to date
    this.renderer.render(this.scene, this.camera);
    
    const canvas = this.renderer.domElement;
    const link = document.createElement('a');
    link.download = 'allofyou.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  }

  onMouseDown(e) {
    if (this.state !== 'mindMap') return;

    // Convert mouse to normalized device coordinates
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Raycast to find clicked panel
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const panels = this.panelGrid.getPanels();
    const meshes = panels.map(p => p.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      this.draggedPanelIndex = panels.findIndex(p => p.mesh === clickedMesh);
      this.isDragging = true;
    }
  }

  onMouseMove(e) {
    if (!this.isDragging || this.draggedPanelIndex < 0) return;

    // Convert mouse to world coordinates
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Calculate world position from mouse
    const frustumSize = this.baseFrustumSize / this.zoomLevel;
    const aspect = window.innerWidth / window.innerHeight;
    const worldX = this.mouse.x * (frustumSize * aspect / 2);
    const worldY = this.mouse.y * (frustumSize / 2);

    this.panelGrid.setDragPosition(this.draggedPanelIndex, worldX, worldY);
  }

  onMouseUp() {
    if (this.isDragging && this.draggedPanelIndex >= 0) {
      this.panelGrid.releaseDrag(this.draggedPanelIndex);
    }
    this.isDragging = false;
    this.draggedPanelIndex = -1;
  }

  toggleState() {
    this.state = this.state === 'face' ? 'mindMap' : 'face';
    
    if (this.state === 'mindMap') {
      this.mindMapLines.show();
    } else {
      this.mindMapLines.hide();
    }
  }

  createDemoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create gradient resembling a face
    const gradient = ctx.createRadialGradient(256, 220, 40, 256, 280, 250);
    gradient.addColorStop(0, '#e8d5c4');
    gradient.addColorStop(0.4, '#d4b5a0');
    gradient.addColorStop(0.7, '#c49f85');
    gradient.addColorStop(1, '#8b6040');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add facial features
    ctx.fillStyle = 'rgba(60, 40, 25, 0.3)';
    
    // Eyes
    ctx.beginPath();
    ctx.ellipse(180, 200, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(332, 200, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyebrows
    ctx.fillStyle = 'rgba(40, 25, 15, 0.4)';
    ctx.fillRect(155, 175, 55, 8);
    ctx.fillRect(305, 175, 55, 8);
    
    // Nose
    ctx.fillStyle = 'rgba(60, 40, 25, 0.15)';
    ctx.beginPath();
    ctx.ellipse(256, 280, 18, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth
    ctx.fillStyle = 'rgba(140, 80, 70, 0.4)';
    ctx.beginPath();
    ctx.ellipse(256, 350, 40, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  setupMouseTracking() {
    window.addEventListener('mousemove', (e) => {
      const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      const mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
      
      this.faceData = {
        detected: true,
        position: { x: mouseX * 0.4, y: mouseY * 0.4, z: 0 },
        rotation: { 
          yaw: mouseX * 0.25, 
          pitch: mouseY * 0.15, 
          roll: 0 
        }
      };
    });
    
    window.addEventListener('mouseleave', () => {
      this.faceData.detected = false;
    });
  }

  setupScene() {
    // Create scene with off-white background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF0EEE9);

    // Orthographic camera for flat look
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 600; // Increased frustum size for mind map spread
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    this.camera.position.z = 500;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('canvas'),
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 600;

    this.camera.left = -frustumSize * aspect / 2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();

    if (this.webcam) {
      this.webcam.update();
    }

    this.panelGrid.update(this.faceData, time, this.state);
    
    if (this.mindMapLines) {
      this.mindMapLines.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Start the app
const app = new App();
app.init().catch((error) => {
  console.error('Failed to initialize app:', error);
  const loading = document.getElementById('loading');
  loading.innerHTML = `
    <p>Error: ${error.message}</p>
    <p class="hint">Please allow camera access and refresh the page</p>
  `;
});
