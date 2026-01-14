import * as THREE from 'three';

export class SpringValue {
  constructor(initialValue = 0, stiffness = 0.1, damping = 0.88) {
    this.current = initialValue;
    this.target = initialValue;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  setTarget(value) {
    this.target = value;
  }

  update() {
    const force = (this.target - this.current) * this.stiffness;
    this.velocity += force;
    this.velocity *= this.damping;
    this.current += this.velocity;
    return this.current;
  }

  get() {
    return this.current;
  }

  setImmediate(value) {
    this.current = value;
    this.target = value;
    this.velocity = 0;
  }
}

export class SpringVector3 {
  constructor(initialValue = new THREE.Vector3(), stiffness = 0.1, damping = 0.88) {
    this.current = initialValue.clone();
    this.target = initialValue.clone();
    this.velocity = new THREE.Vector3();
    this.stiffness = stiffness;
    this.damping = damping;
  }

  setTarget(x, y, z) {
    if (x instanceof THREE.Vector3) {
      this.target.copy(x);
    } else {
      this.target.set(x, y, z);
    }
  }

  update() {
    // Calculate spring force
    const force = new THREE.Vector3()
      .subVectors(this.target, this.current)
      .multiplyScalar(this.stiffness);
    
    // Apply force to velocity
    this.velocity.add(force);
    
    // Apply damping
    this.velocity.multiplyScalar(this.damping);
    
    // Update position
    this.current.add(this.velocity);
    
    return this.current;
  }

  get() {
    return this.current;
  }

  setImmediate(x, y, z) {
    if (x instanceof THREE.Vector3) {
      this.current.copy(x);
      this.target.copy(x);
    } else {
      this.current.set(x, y, z);
      this.target.set(x, y, z);
    }
    this.velocity.set(0, 0, 0);
  }

  setStiffness(stiffness) {
    this.stiffness = stiffness;
  }

  setDamping(damping) {
    this.damping = damping;
  }
}

// Utility function for simple lerp
export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

// Utility function to map a value from one range to another
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

// Clamp a value between min and max
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
