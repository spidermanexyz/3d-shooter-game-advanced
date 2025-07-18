import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleGroups = [];
        this.maxParticles = 1000;
        
        console.log('ParticleSystem initialized');
    }
    
    async init() {
        console.log('Initializing particle system...');
        
        // Create particle materials
        this.materials = {
            spark: new THREE.PointsMaterial({
                color: 0xffaa00,
                size: 0.1,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            }),
            smoke: new THREE.PointsMaterial({
                color: 0x666666,
                size: 0.3,
                transparent: true,
                opacity: 0.5,
                blending: THREE.NormalBlending
            }),
            blood: new THREE.PointsMaterial({
                color: 0xff0000,
                size: 0.15,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            }),
            muzzleFlash: new THREE.PointsMaterial({
                color: 0xffff00,
                size: 0.2,
                transparent: true,
                opacity: 1.0,
                blending: THREE.AdditiveBlending
            })
        };
        
        console.log('Particle system initialized');
    }
    
    createParticleGroup(count, material, position, velocity, life) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const lifetimes = new Float32Array(count);
        const maxLifetimes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Position
            positions[i3] = position.x + (Math.random() - 0.5) * 0.2;
            positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.2;
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.2;
            
            // Velocity
            const vel = velocity.clone();
            vel.x += (Math.random() - 0.5) * 2;
            vel.y += (Math.random() - 0.5) * 2;
            vel.z += (Math.random() - 0.5) * 2;
            
            velocities[i3] = vel.x;
            velocities[i3 + 1] = vel.y;
            velocities[i3 + 2] = vel.z;
            
            // Lifetime
            const particleLife = life + (Math.random() - 0.5) * life * 0.5;
            lifetimes[i] = particleLife;
            maxLifetimes[i] = particleLife;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('maxLifetime', new THREE.BufferAttribute(maxLifetimes, 1));
        
        const particles = new THREE.Points(geometry, material);
        particles.userData = {
            isParticleSystem: true,
            createdAt: Date.now()
        };
        
        this.scene.add(particles);
        this.particleGroups.push(particles);
        
        return particles;
    }
    
    createMuzzleFlash(position, rotation) {
        const flashPosition = position.clone();
        flashPosition.add(new THREE.Vector3(0.3, -0.2, -0.8).applyEuler(rotation));
        
        const velocity = new THREE.Vector3(0, 0, -5).applyEuler(rotation);
        
        this.createParticleGroup(
            20,
            this.materials.muzzleFlash,
            flashPosition,
            velocity,
            0.1
        );
        
        // Add some sparks
        this.createParticleGroup(
            10,
            this.materials.spark,
            flashPosition,
            new THREE.Vector3(0, 0, -3).applyEuler(rotation),
            0.3
        );
    }
    
    createHitEffect(position) {
        // Blood particles
        this.createParticleGroup(
            15,
            this.materials.blood,
            position,
            new THREE.Vector3(0, 1, 0),
            1.0
        );
        
        // Sparks
        this.createParticleGroup(
            10,
            this.materials.spark,
            position,
            new THREE.Vector3(0, 2, 0),
            0.5
        );
    }
    
    createExplosion(position, intensity = 1) {
        const particleCount = Math.floor(50 * intensity);
        
        // Fire particles
        this.createParticleGroup(
            particleCount,
            this.materials.spark,
            position,
            new THREE.Vector3(0, 5, 0),
            2.0
        );
        
        // Smoke
        this.createParticleGroup(
            Math.floor(particleCount * 0.7),
            this.materials.smoke,
            position,
            new THREE.Vector3(0, 3, 0),
            4.0
        );
    }
    
    update(deltaTime) {
        // Update all particle groups
        for (let i = this.particleGroups.length - 1; i >= 0; i--) {
            const particles = this.particleGroups[i];
            
            if (this.updateParticleGroup(particles, deltaTime)) {
                // Remove expired particle group
                this.scene.remove(particles);
                particles.geometry.dispose();
                this.particleGroups.splice(i, 1);
            }
        }
    }
    
    updateParticleGroup(particles, deltaTime) {
        const geometry = particles.geometry;
        const positions = geometry.attributes.position.array;
        const velocities = geometry.attributes.velocity.array;
        const lifetimes = geometry.attributes.lifetime.array;
        const maxLifetimes = geometry.attributes.maxLifetime.array;
        
        let allDead = true;
        
        for (let i = 0; i < lifetimes.length; i++) {
            if (lifetimes[i] > 0) {
                allDead = false;
                
                const i3 = i * 3;
                
                // Update position
                positions[i3] += velocities[i3] * deltaTime;
                positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
                positions[i3 + 2] += velocities[i3 + 2] * deltaTime;
                
                // Apply gravity
                velocities[i3 + 1] -= 9.8 * deltaTime;
                
                // Apply air resistance
                velocities[i3] *= 0.98;
                velocities[i3 + 1] *= 0.98;
                velocities[i3 + 2] *= 0.98;
                
                // Update lifetime
                lifetimes[i] -= deltaTime;
                
                // Update opacity based on lifetime
                const lifePercent = lifetimes[i] / maxLifetimes[i];
                if (particles.material.opacity !== undefined) {
                    particles.material.opacity = Math.max(0, lifePercent);
                }
            }
        }
        
        // Mark attributes as needing update
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.velocity.needsUpdate = true;
        geometry.attributes.lifetime.needsUpdate = true;
        
        return allDead;
    }
    
    clear() {
        // Remove all particle groups
        this.particleGroups.forEach(particles => {
            this.scene.remove(particles);
            particles.geometry.dispose();
        });
        this.particleGroups = [];
    }
}