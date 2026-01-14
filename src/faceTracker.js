import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export class FaceTracker {
  constructor() {
    this.faceMesh = null;
    this.camera = null;
    this.isReady = false;
    this.faceData = {
      detected: false,
      position: { x: 0, y: 0, z: 0 },
      rotation: { yaw: 0, pitch: 0, roll: 0 },
      landmarks: null
    };
    this.onResultsCallback = null;
  }

  async init(videoElement) {
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults((results) => this.onResults(results));

    await this.faceMesh.initialize();

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        await this.faceMesh.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    await this.camera.start();
    this.isReady = true;

    return this;
  }

  onResults(results) {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      this.faceData.detected = true;
      this.faceData.landmarks = landmarks;

      // Extract face position from nose tip (landmark 1)
      const noseTip = landmarks[1];
      // Convert from 0-1 range to -1 to 1 range, centered
      this.faceData.position.x = (noseTip.x - 0.5) * 2;
      this.faceData.position.y = -(noseTip.y - 0.5) * 2; // Flip Y
      this.faceData.position.z = noseTip.z * 2;

      // Calculate head rotation from face geometry
      this.calculateRotation(landmarks);
    } else {
      this.faceData.detected = false;
    }

    if (this.onResultsCallback) {
      this.onResultsCallback(this.faceData);
    }
  }

  calculateRotation(landmarks) {
    // Use key landmarks to estimate head pose
    // Nose tip: 1, Left eye outer: 33, Right eye outer: 263
    // Chin: 152, Forehead: 10

    const noseTip = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const chin = landmarks[152];
    const forehead = landmarks[10];

    // Yaw (left-right rotation) - based on eye positions relative to nose
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const eyeDiff = noseTip.x - eyeMidX;
    this.faceData.rotation.yaw = eyeDiff * 3; // Scale factor for sensitivity

    // Pitch (up-down rotation) - based on nose-forehead-chin vertical relationship
    const faceHeight = chin.y - forehead.y;
    const nosePosInFace = (noseTip.y - forehead.y) / faceHeight;
    this.faceData.rotation.pitch = (nosePosInFace - 0.6) * 2; // 0.6 is neutral position

    // Roll (head tilt) - based on eye angle
    const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    this.faceData.rotation.roll = eyeAngle;
  }

  getFaceData() {
    return this.faceData;
  }

  setOnResultsCallback(callback) {
    this.onResultsCallback = callback;
  }

  isDetected() {
    return this.faceData.detected;
  }
}
