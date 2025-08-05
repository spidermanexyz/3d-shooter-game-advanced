import * as THREE from 'three';
import { WeaponSystem } from '../weapons/WeaponSystem.js';
import { EnemySystem } from '../enemies/EnemySystem.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { AudioSystem } from '../audio/AudioSystem.js';
import { UIManager } from '../ui/UIManager.js';

export class GameEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        
        // Game systems
        this.weaponSystem = null;
        this.enemySystem = null;
        this.particleSystem = null;
        this.audioSystem = null;
        this.uiManager = null;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.playerHealth = 100;
        this.score = 0;
        
        // Controls
        this.keys = {};
        this.mouse = { x: 0, y: 0, sensitivity: 0.002 };
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shoot: false,
            reload: false
        };
        
        // Player
        this.player = {
            position: new THREE.Vector3(0, 1.8, 5),
            rotation: new THREE.Euler(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            speed: 5,
            health: 100
        };
        
        // Raycaster for shooting
        this.raycaster = new THREE.Raycaster();
        
        // Clock for delta time
        this.clock = new THREE.Clock();
        
        console.log('GameEngine initialized');
    }
    
    async init() {
        console.log('Initializing game engine...');
        
        // Get canvas
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Game canvas not found');
        }
        
        // Initialize Three.js
        this.initThreeJS();
        
        // Initialize game systems
        this.weaponSystem = new WeaponSystem(this.scene, this.camera);
        this.enemySystem = new EnemySystem(this.scene);
        this.particleSystem = new ParticleSystem(this.scene);
        this.audioSystem = new AudioSystem();
        this.uiManager = new UIManager();
        
        // Initialize systems
        await this.weaponSystem.init();
        await this.enemySystem.init();
        await this.particleSystem.init();
        await this.audioSystem.init();
        await this.uiManager.init();
        
        // Setup scene
        this.setupScene();
        this.setupLighting();
        this.setupControls();
        
        // Spawn initial enemies
        this.enemySystem.spawnEnemies(5);
        
        console.log('Game engine initialized successfully');
    }
    
    initThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 10, 100);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.copy(this.player.position);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupScene() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create some cover objects
        this.createCoverObjects();
        
        // Add skybox
        this.createSkybox();
    }
    
    createCoverObjects() {
        const boxGeometry = new THREE.BoxGeometry(2, 3, 2);
        const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        // Create several cover boxes
        const positions = [
            { x: 10, z: 0 },
            { x: -10, z: 5 },
            { x: 0, z: -15 },
            { x: 15, z: -10 },
            { x: -15, z: -5 }
        ];
        
        positions.forEach(pos => {
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.position.set(pos.x, 1.5, pos.z);
            box.castShadow = true;
            box.receiveShadow = true;
            this.scene.add(box);
        });
    }
    
    createSkybox() {
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x001122,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);
        
        // Point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0x00ffff, 0.5, 30);
        pointLight1.position.set(10, 5, 10);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff0080, 0.5, 30);
        pointLight2.position.set(-10, 5, -10);
        this.scene.add(pointLight2);
    }
    
    setupControls() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Mouse events
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Left click
                this.controls.shoot = true;
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                this.controls.shoot = false;
            }
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.isRunning && !this.isPaused) {
                this.mouse.x += event.movementX * this.mouse.sensitivity;
                this.mouse.y += event.movementY * this.mouse.sensitivity;
                this.mouse.y = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouse.y));
            }
        });
        
        // Pointer lock
        this.canvas.addEventListener('click', () => {
            if (this.isRunning && !this.isPaused) {
                this.canvas.requestPointerLock();
            }
        });
    }
    
    handleKeyDown(event) {
        switch(event.code) {
            case 'KeyR':
                this.weaponSystem.reload();
                break;
            case 'Tab':
                event.preventDefault();
                window.toggleWeaponCustomization();
                break;
            case 'Escape':
                this.setPaused(!this.isPaused);
                break;
        }
    }
    
    updateControls() {
        // Update movement controls
        this.controls.forward = this.keys['KeyW'] || false;
        this.controls.backward = this.keys['KeyS'] || false;
        this.controls.left = this.keys['KeyA'] || false;
        this.controls.right = this.keys['KeyD'] || false;
    }
    
    updatePlayer(deltaTime) {
        // Update camera rotation
        this.camera.rotation.y = -this.mouse.x;
        this.camera.rotation.x = -this.mouse.y;
        
        // Calculate movement
        const moveVector = new THREE.Vector3();
        
        if (this.controls.forward) moveVector.z -= 1;
        if (this.controls.backward) moveVector.z += 1;
        if (this.controls.left) moveVector.x -= 1;
        if (this.controls.right) moveVector.x += 1;
        
        // Normalize and apply speed
        if (moveVector.length() > 0) {
            moveVector.normalize();
            moveVector.multiplyScalar(this.player.speed * deltaTime);
            
            // Apply camera rotation to movement
            moveVector.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
            
            // Update player position
            this.player.position.add(moveVector);
            this.camera.position.copy(this.player.position);
        }
        
        // Handle shooting
        if (this.controls.shoot) {
            this.handleShooting();
        }
    }
    
    handleShooting() {
        if (this.weaponSystem.canShoot()) {
            // Setup raycaster
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
            
            // Check for hits
            const enemies = this.enemySystem.getEnemies();
            const intersects = this.raycaster.intersectObjects(enemies, true);
            
            if (intersects.length > 0) {
                const hit = intersects[0];
                const enemy = hit.object.parent || hit.object;
                
                // Damage enemy
                if (this.enemySystem.damageEnemy(enemy, this.weaponSystem.getCurrentWeapon().damage)) {
                    this.score += 100;
                }
                
                // Create hit effect
                this.particleSystem.createHitEffect(hit.point);
                this.audioSystem.playHitSound();
            }
            
            // Shoot weapon
            this.weaponSystem.shoot();
            
            // Create muzzle flash
            this.particleSystem.createMuzzleFlash(this.camera.position, this.camera.rotation);
        }
    }
    
    update() {
        if (!this.isRunning || this.isPaused) return;
        
        const deltaTime = this.clock.getDelta();
        
        // Update controls
        this.updateControls();
        
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update systems
        this.weaponSystem.update(deltaTime);
        this.enemySystem.update(deltaTime, this.player.position);
        this.particleSystem.update(deltaTime);
        this.audioSystem.update(deltaTime);
        
        // Update UI
        this.uiManager.updateHUD({
            health: this.player.health,
            ammo: this.weaponSystem.getCurrentAmmo(),
            weapon: this.weaponSystem.getCurrentWeaponName(),
            enemies: this.enemySystem.getAliveCount()
        });
        
        // Check for enemy attacks
        const enemyDamage = this.enemySystem.checkPlayerDamage(this.player.position);
        if (enemyDamage > 0) {
            this.player.health -= enemyDamage;
            if (this.player.health <= 0) {
                this.gameOver();
            }
        }
        
        // Spawn new enemies if needed
        if (this.enemySystem.getAliveCount() === 0) {
            this.enemySystem.spawnEnemies(Math.min(10, 5 + Math.floor(this.score / 1000)));
        }
    }
    
    render() {
        if (!this.isRunning) return;
        this.renderer.render(this.scene, this.camera);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    start() {
        console.log('Starting game loop...');
        this.isRunning = true;
        this.clock.start();
        this.gameLoop();
    }
    
    setPaused(paused) {
        this.isPaused = paused;
        if (paused) {
            document.exitPointerLock();
        }
    }
    
    gameOver() {
        this.isRunning = false;
        
        // Create game over screen
        const gameOverScreen = document.createElement('div');
        gameOverScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
        `;
        
        gameOverScreen.innerHTML = `
            <h1 style="font-size: 4rem; margin-bottom: 20px; color: #ff0000;">GAME OVER</h1>
            <p style="font-size: 1.5rem; margin-bottom: 10px;">Final Score: ${this.score}</p>
            <p style="font-size: 1.2rem; margin-bottom: 30px; color: #ccc;">You survived ${Math.floor(Date.now() / 1000 - this.startTime)} seconds</p>
            <div style="display: flex; gap: 20px;">
                <button onclick="location.reload()" style="
                    background: linear-gradient(45deg, #00ffff, #0080ff);
                    border: none;
                    color: black;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    border-radius: 10px;
                    cursor: pointer;
                ">Play Again</button>
                <button onclick="returnToLobby(); this.parentElement.parentElement.remove();" style="
                    background: linear-gradient(45deg, #666, #888);
                    border: none;
                    color: white;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    border-radius: 10px;
                    cursor: pointer;
                ">Return to Lobby</button>
            </div>
        `;
        
        document.body.appendChild(gameOverScreen);
    }
    
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        // Clean up
        if (this.scene) {
            this.particleSystem.clear();
        }
    }
}