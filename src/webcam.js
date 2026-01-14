import * as THREE from 'three';

export class WebcamTexture {
  constructor() {
    this.video = document.getElementById('webcam');
    this.texture = null;
    this.isReady = false;
    this.width = 640;
    this.height = 480;
  }

  async init() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: this.width },
          height: { ideal: this.height }
        },
        audio: false
      });

      this.video.srcObject = stream;
      
      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          this.width = this.video.videoWidth;
          this.height = this.video.videoHeight;
          this.createTexture();
          this.isReady = true;
          resolve(this);
        };
      });
    } catch (error) {
      console.error('Webcam access denied:', error);
      throw error;
    }
  }

  createTexture() {
    this.texture = new THREE.VideoTexture(this.video);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.format = THREE.RGBAFormat;
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  update() {
    if (this.texture && this.isReady) {
      this.texture.needsUpdate = true;
    }
  }

  getTexture() {
    return this.texture;
  }

  getVideo() {
    return this.video;
  }

  getAspect() {
    return this.width / this.height;
  }
}
