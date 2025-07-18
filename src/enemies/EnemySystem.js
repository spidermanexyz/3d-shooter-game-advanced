import * as THREE from 'three';

export class EnemySystem {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.enemyPool = [];
        this.maxEnemies = 20;
        
        // Enemy configuration
        this.enemyConfig = {
            health: 100,
            speed: 2,
            damage: 15,
            attackRange: 3,
            detectionRange: 25,
            attackCooldown: 2000 // ms
        };
        
        console.log('EnemySystem initialized');
    }
    
    async init() {
        console.log('Initializing enemy system...');
        
        // Pre-create enemy pool for performance
        for (let i = 0; i < this.maxEnemies; i++) {
            const enemy = this.createEnemyModel();
            enemy.visible = false;
            this.enemyPool.push(enemy);
            this.scene.add(enemy);
        }
        
        console.log('Enemy system initialized');
    }
    
    createEnemyModel() {
        const enemy = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x660000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        enemy.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.3);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x440000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2;
        head.castShadow = true;
        enemy.add(head);
        
        // Eyes (glowing red)
        const eyeGeometry = new THREE.SphereGeometry(0.05);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 2.1, 0.25);
        enemy.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 2.1, 0.25);
        enemy.add(rightEye);
        
        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.15, 0.8);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x550000 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.7, 1.2, 0);
        leftArm.rotation.z = 0.3;
        leftArm.castShadow = true;
        enemy.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.7, 1.2, 0);
        rightArm.rotation.z = -0.3;
        rightArm.castShadow = true;
        enemy.add(rightArm);
        
        // Initialize enemy data
        enemy.userData = {
            health: this.enemyConfig.health,
            maxHealth: this.enemyConfig.health,
            state: 'patrol', // patrol, chase, attack, dead
            target: null,
            lastAttackTime: 0,
            patrolTarget: new THREE.Vector3(),
            patrolTime: 0,
            isAlive: true,
            speed: this.enemyConfig.speed + (Math.random() - 0.5) * 0.5,
            damage: this.enemyConfig.damage + Math.floor((Math.random() - 0.5) * 10)
        };
        
        // Set random patrol target
        this.setRandomPatrolTarget(enemy);
        
        return enemy;
    }
    
    spawnEnemies(count) {
        console.log(`Spawning ${count} enemies...`);
        
        for (let i = 0; i < count && this.enemies.length < this.maxEnemies; i++) {
            const enemy = this.getEnemyFromPool();
            if (enemy) {
                this.spawnEnemy(enemy);
                this.enemies.push(enemy);
            }
        }
    }
    
    getEnemyFromPool() {
        return this.enemyPool.find(enemy => !enemy.visible);
    }
    
    spawnEnemy(enemy) {
        // Reset enemy state
        enemy.userData.health = this.enemyConfig.health;
        enemy.userData.state = 'patrol';
        enemy.userData.isAlive = true;
        enemy.userData.lastAttackTime = 0;
        
        // Random spawn position (away from player)
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        enemy.position.set(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        );
        
        // Set random patrol target
        this.setRandomPatrolTarget(enemy);
        
        // Make visible
        enemy.visible = true;
        
        // Reset materials to original color
        enemy.children.forEach(child => {
            if (child.material && child.material.color) {
                child.material.color.setHex(child.userData.originalColor || 0x660000);
            }
        });
    }
    
    setRandomPatrolTarget(enemy) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 10;
        enemy.userData.patrolTarget.set(
            enemy.position.x + Math.cos(angle) * distance,
            0,
            enemy.position.z + Math.sin(angle) * distance
        );
        enemy.userData.patrolTime = Date.now() + (3000 + Math.random() * 5000);
    }
    
    update(deltaTime, playerPosition) {
        this.enemies.forEach(enemy => {
            if (!enemy.visible || !enemy.userData.isAlive) return;
            
            this.updateEnemyAI(enemy, deltaTime, playerPosition);
            this.updateEnemyAnimation(enemy, deltaTime);
        });
        
        // Remove dead enemies
        this.enemies = this.enemies.filter(enemy => enemy.userData.isAlive);
    }
    
    updateEnemyAI(enemy, deltaTime, playerPosition) {
        const distanceToPlayer = enemy.position.distanceTo(playerPosition);
        const userData = enemy.userData;
        
        // State machine
        switch (userData.state) {
            case 'patrol':
                this.handlePatrolState(enemy, deltaTime, playerPosition, distanceToPlayer);
                break;
            case 'chase':
                this.handleChaseState(enemy, deltaTime, playerPosition, distanceToPlayer);
                break;
            case 'attack':
                this.handleAttackState(enemy, deltaTime, playerPosition, distanceToPlayer);
                break;
        }
    }
    
    handlePatrolState(enemy, deltaTime, playerPosition, distanceToPlayer) {
        const userData = enemy.userData;
        
        // Check if player is in detection range
        if (distanceToPlayer < this.enemyConfig.detectionRange) {
            userData.state = 'chase';
            userData.target = playerPosition.clone();
            return;
        }
        
        // Move towards patrol target
        const direction = userData.patrolTarget.clone().sub(enemy.position);
        direction.y = 0;
        
        if (direction.length() > 0.5) {
            direction.normalize();
            direction.multiplyScalar(userData.speed * deltaTime);
            enemy.position.add(direction);
            
            // Face movement direction
            enemy.lookAt(userData.patrolTarget);
        } else if (Date.now() > userData.patrolTime) {
            // Set new patrol target
            this.setRandomPatrolTarget(enemy);
        }
    }
    
    handleChaseState(enemy, deltaTime, playerPosition, distanceToPlayer) {
        const userData = enemy.userData;
        
        // Check if player is too far away
        if (distanceToPlayer > this.enemyConfig.detectionRange * 1.5) {
            userData.state = 'patrol';
            this.setRandomPatrolTarget(enemy);
            return;
        }
        
        // Check if close enough to attack
        if (distanceToPlayer < this.enemyConfig.attackRange) {
            userData.state = 'attack';
            return;
        }
        
        // Move towards player
        const direction = playerPosition.clone().sub(enemy.position);
        direction.y = 0;
        direction.normalize();
        direction.multiplyScalar(userData.speed * deltaTime * 1.5); // Faster when chasing
        
        enemy.position.add(direction);
        enemy.lookAt(playerPosition);
    }
    
    handleAttackState(enemy, deltaTime, playerPosition, distanceToPlayer) {
        const userData = enemy.userData;
        
        // Check if player moved away
        if (distanceToPlayer > this.enemyConfig.attackRange * 1.2) {
            userData.state = 'chase';
            return;
        }
        
        // Face player
        enemy.lookAt(playerPosition);
        
        // Attack cooldown
        if (Date.now() - userData.lastAttackTime > this.enemyConfig.attackCooldown) {
            userData.lastAttackTime = Date.now();
            // Attack will be handled by checkPlayerDamage
        }
    }
    
    updateEnemyAnimation(enemy, deltaTime) {
        // Simple bobbing animation
        const time = Date.now() * 0.003;
        const bobAmount = 0.1;
        enemy.position.y = Math.sin(time + enemy.position.x) * bobAmount;
        
        // Eye glow animation
        const glowIntensity = 0.5 + Math.sin(time * 2) * 0.3;
        enemy.children.forEach(child => {
            if (child.material && child.material.emissive) {
                child.material.emissiveIntensity = glowIntensity;
            }
        });
    }
    
    damageEnemy(enemy, damage) {
        if (!enemy.userData.isAlive) return false;
        
        enemy.userData.health -= damage;
        
        // Visual damage feedback
        const healthPercent = enemy.userData.health / enemy.userData.maxHealth;
        const damageColor = new THREE.Color().lerpColors(
            new THREE.Color(0xff0000), // Red when damaged
            new THREE.Color(0x660000), // Original color
            healthPercent
        );
        
        enemy.children.forEach(child => {
            if (child.material && child.material.color && !child.material.emissive) {
                child.material.color.copy(damageColor);
            }
        });
        
        // Check if dead
        if (enemy.userData.health <= 0) {
            this.killEnemy(enemy);
            return true; // Enemy killed
        }
        
        // Switch to chase state when damaged
        enemy.userData.state = 'chase';
        
        return false; // Enemy damaged but alive
    }
    
    killEnemy(enemy) {
        enemy.userData.isAlive = false;
        enemy.visible = false;
        
        // Remove from active enemies list (handled in update loop)
    }
    
    checkPlayerDamage(playerPosition) {
        let totalDamage = 0;
        
        this.enemies.forEach(enemy => {
            if (!enemy.visible || !enemy.userData.isAlive) return;
            
            const userData = enemy.userData;
            if (userData.state === 'attack') {
                const distanceToPlayer = enemy.position.distanceTo(playerPosition);
                
                if (distanceToPlayer < this.enemyConfig.attackRange &&
                    Date.now() - userData.lastAttackTime < 100) { // Attack just happened
                    totalDamage += userData.damage;
                }
            }
        });
        
        return totalDamage;
    }
    
    getEnemies() {
        return this.enemies.filter(enemy => enemy.visible && enemy.userData.isAlive);
    }
    
    getAliveCount() {
        return this.enemies.filter(enemy => enemy.visible && enemy.userData.isAlive).length;
    }
}