import * as THREE from 'three';

export class Connectors {
  constructor() {
    this.connectors = [];
    this.group = new THREE.Group();
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    this.dotMaterial = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.8
    });
  }

  init(panels) {
    // Create small white connector bars with dots, inspired by the reference
    // These look like small USB/connector-style elements
    
    const connectorConfigs = [
      { width: 16, height: 5, dotCount: 3 },
      { width: 12, height: 4, dotCount: 2 },
      { width: 20, height: 5, dotCount: 4 },
    ];

    // Find pairs of nearby panels and add connectors between them
    const usedPairs = new Set();
    
    panels.forEach((panelA, i) => {
      panels.forEach((panelB, j) => {
        if (i >= j) return; // Avoid duplicates and self-pairs
        
        const posA = panelA.basePosition;
        const posB = panelB.basePosition;
        
        // Calculate distance between panel centers
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Only connect panels that are relatively close (50-120 units apart)
        if (dist < 50 || dist > 120) return;
        
        // Random chance to create connector (not every pair needs one)
        if (Math.random() > 0.4) return;
        
        const pairKey = `${i}-${j}`;
        if (usedPairs.has(pairKey)) return;
        usedPairs.add(pairKey);

        // Calculate connector position and rotation
        const midX = (posA.x + posB.x) / 2;
        const midY = (posA.y + posB.y) / 2;
        const midZ = Math.max(posA.z, posB.z) + 8;
        
        // Rotation to align with the connection direction
        const angle = Math.atan2(dy, dx);
        
        // Choose a random connector style
        const config = connectorConfigs[Math.floor(Math.random() * connectorConfigs.length)];
        
        // Create the main connector bar
        const connector = this.createConnector(midX, midY, midZ, angle, config, panelA, panelB);
        this.connectors.push(connector);
      });
    });

    return this.group;
  }

  createConnector(x, y, z, angle, config, panelA, panelB) {
    const connectorGroup = new THREE.Group();
    
    // Main bar
    const barGeometry = new THREE.BoxGeometry(config.width, config.height, 2);
    const bar = new THREE.Mesh(barGeometry, this.material);
    connectorGroup.add(bar);
    
    // Add small dots/circles on the bar
    const dotRadius = 1.2;
    const dotSpacing = config.width / (config.dotCount + 1);
    
    for (let i = 0; i < config.dotCount; i++) {
      const dotGeometry = new THREE.CircleGeometry(dotRadius, 8);
      const dot = new THREE.Mesh(dotGeometry, this.dotMaterial);
      dot.position.x = -config.width / 2 + dotSpacing * (i + 1);
      dot.position.z = 1.5;
      connectorGroup.add(dot);
    }
    
    // Position and rotate the connector group
    connectorGroup.position.set(x, y, z);
    connectorGroup.rotation.z = angle;
    
    this.group.add(connectorGroup);
    
    return {
      group: connectorGroup,
      panelA,
      panelB,
      basePosition: new THREE.Vector3(x, y, z),
      baseRotation: angle
    };
  }

  update(time) {
    // Update connector positions to follow their connected panels
    this.connectors.forEach((connector) => {
      const posA = connector.panelA.mesh.position;
      const posB = connector.panelB.mesh.position;

      // Position at midpoint between the two panels
      const midX = (posA.x + posB.x) / 2;
      const midY = (posA.y + posB.y) / 2;
      const midZ = Math.max(posA.z, posB.z) + 8;

      // Update rotation to follow panel movement
      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const angle = Math.atan2(dy, dx);

      connector.group.position.set(midX, midY, midZ);
      connector.group.rotation.z = angle;

      // Subtle scale pulse
      const pulse = 1 + Math.sin(time * 1.5 + midX * 0.05) * 0.03;
      connector.group.scale.setScalar(pulse);
    });
  }

  getGroup() {
    return this.group;
  }
}
