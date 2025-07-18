import * as THREE from 'three';

export class WeaponSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Weapon definitions
        this.weaponTypes = {
            assault: {
                name: 'Assault Rifle',
                damage: 25,
                fireRate: 600, // rounds per minute
                accuracy: 0.85,
                range: 50,
                recoil: 0.02,
                ammo: 30,
                maxAmmo: 90,
                reloadTime: 2.5
            },
            sniper: {
                name: 'Sniper Rifle',
                damage: 80,
                fireRate: 60,
                accuracy: 0.98,
                range: 100,
                recoil: 0.08,
                ammo: 5,
                maxAmmo: 20,
                reloadTime: 3.5
            },
            shotgun: {
                name: 'Shotgun',
                damage: 60,
                fireRate: 120,
                accuracy: 0.6,
                range: 20,
                recoil: 0.12,
                ammo: 8,
                maxAmmo: 32,
                reloadTime: 4.0
            }
        };
        
        // Attachment definitions
        this.attachments = {
            scope: { accuracy: 0.15, range: 10, name: 'Scope' },
            silencer: { damage: -5, accuracy: 0.1, name: 'Silencer' },
            grip: { recoil: -0.01, accuracy: 0.05, name: 'Grip' },
            laser: { accuracy: 0.08, name: 'Laser' },
            flashlight: { range: 5, name: 'Flashlight' },
            bipod: { recoil: -0.02, accuracy: 0.12, name: 'Bipod' }
        };
        
        // Skin definitions
        this.skins = {
            default: { name: 'Default', color: 0x444444 },
            camo: { name: 'Camo', color: 0x4a5d23 },
            gold: { name: 'Gold', color: 0xffd700 },
            neon: { name: 'Neon', color: 0x00ffff },
            carbon: { name: 'Carbon Fiber', color: 0x1a1a1a },
            chrome: { name: 'Chrome', color: 0xc0c0c0 }
        };
        
        // Current configuration
        this.currentWeapon = 'assault';
        this.currentAttachments = new Set();
        this.currentSkin = 'default';
        
        // Weapon state
        this.currentAmmo = this.weaponTypes[this.currentWeapon].ammo;
        this.reserveAmmo = this.weaponTypes[this.currentWeapon].maxAmmo;
        this.lastShotTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        
        // Weapon model
        this.weaponModel = null;
        
        console.log('WeaponSystem initialized');
    }
    
    async init() {
        console.log('Initializing weapon system...');
        
        // Create weapon model
        this.createWeaponModel();
        
        // Setup UI event listeners
        this.setupUIListeners();
        
        // Update UI
        this.updateWeaponStats();
        
        console.log('Weapon system initialized');
    }
    
    createWeaponModel() {
        // Create weapon group
        if (this.weaponModel) {
            this.scene.remove(this.weaponModel);
        }
        
        this.weaponModel = new THREE.Group();
        
        // Create main weapon body
        const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
        const weaponMaterial = new THREE.MeshLambertMaterial({ 
            color: this.skins[this.currentSkin].color 
        });
        const weaponBody = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weaponBody.position.set(0.3, -0.2, -0.5);
        this.weaponModel.add(weaponBody);
        
        // Create barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0.3, -0.15, -0.7);
        this.weaponModel.add(barrel);
        
        // Add attachments
        this.addAttachmentModels();
        
        // Position weapon relative to camera
        this.weaponModel.position.set(0, 0, 0);
        this.camera.add(this.weaponModel);
    }
    
    addAttachmentModels() {
        // Clear existing attachments
        const attachmentObjects = this.weaponModel.children.filter(child => child.userData.isAttachment);
        attachmentObjects.forEach(obj => this.weaponModel.remove(obj));
        
        // Add current attachments
        this.currentAttachments.forEach(attachmentType => {
            const attachment = this.createAttachmentModel(attachmentType);
            if (attachment) {
                attachment.userData.isAttachment = true;
                this.weaponModel.add(attachment);
            }
        });
    }
    
    createAttachmentModel(type) {
        const material = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        switch(type) {
            case 'scope':
                const scopeGeometry = new THREE.BoxGeometry(0.05, 0.08, 0.15);
                const scope = new THREE.Mesh(scopeGeometry, material);
                scope.position.set(0.3, -0.05, -0.4);
                return scope;
                
            case 'silencer':
                const silencerGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.2);
                const silencer = new THREE.Mesh(silencerGeometry, material);
                silencer.rotation.z = Math.PI / 2;
                silencer.position.set(0.3, -0.15, -0.9);
                return silencer;
                
            case 'grip':
                const gripGeometry = new THREE.BoxGeometry(0.03, 0.1, 0.03);
                const grip = new THREE.Mesh(gripGeometry, material);
                grip.position.set(0.3, -0.3, -0.3);
                return grip;
                
            case 'laser':
                const laserGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.05);
                const laser = new THREE.Mesh(laserGeometry, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
                laser.position.set(0.32, -0.18, -0.4);
                return laser;
                
            case 'flashlight':
                const flashlightGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.08);
                const flashlight = new THREE.Mesh(flashlightGeometry, material);
                flashlight.rotation.z = Math.PI / 2;
                flashlight.position.set(0.28, -0.18, -0.4);
                return flashlight;
                
            case 'bipod':
                const bipodGeometry = new THREE.BoxGeometry(0.02, 0.15, 0.02);
                const bipod = new THREE.Mesh(bipodGeometry, material);
                bipod.position.set(0.3, -0.35, -0.6);
                return bipod;
        }
        
        return null;
    }
    
    setupUIListeners() {
        // Weapon type buttons
        document.querySelectorAll('[data-weapon]').forEach(button => {
            button.addEventListener('click', () => {
                this.setWeapon(button.dataset.weapon);
                this.updateButtonStates();
                this.updateWeaponStats();
            });
        });
        
        // Attachment buttons
        document.querySelectorAll('[data-attachment]').forEach(button => {
            button.addEventListener('click', () => {
                this.toggleAttachment(button.dataset.attachment);
                this.updateButtonStates();
                this.updateWeaponStats();
            });
        });
        
        // Skin buttons
        document.querySelectorAll('[data-skin]').forEach(button => {
            button.addEventListener('click', () => {
                this.setSkin(button.dataset.skin);
                this.updateButtonStates();
            });
        });
    }
    
    setWeapon(weaponType) {
        if (this.weaponTypes[weaponType]) {
            this.currentWeapon = weaponType;
            this.currentAmmo = this.weaponTypes[weaponType].ammo;
            this.reserveAmmo = this.weaponTypes[weaponType].maxAmmo;
            this.createWeaponModel();
        }
    }
    
    toggleAttachment(attachmentType) {
        if (this.currentAttachments.has(attachmentType)) {
            this.currentAttachments.delete(attachmentType);
        } else {
            this.currentAttachments.add(attachmentType);
        }
        this.addAttachmentModels();
    }
    
    setSkin(skinType) {
        if (this.skins[skinType]) {
            this.currentSkin = skinType;
            this.createWeaponModel();
        }
    }
    
    updateButtonStates() {
        // Update weapon buttons
        document.querySelectorAll('[data-weapon]').forEach(button => {
            button.classList.toggle('active', button.dataset.weapon === this.currentWeapon);
        });
        
        // Update attachment buttons
        document.querySelectorAll('[data-attachment]').forEach(button => {
            button.classList.toggle('active', this.currentAttachments.has(button.dataset.attachment));
        });
        
        // Update skin buttons
        document.querySelectorAll('[data-skin]').forEach(button => {
            button.classList.toggle('active', button.dataset.skin === this.currentSkin);
        });
    }
    
    updateWeaponStats() {
        const weapon = this.getCurrentWeapon();
        
        // Calculate percentages for display
        const damagePercent = Math.min(100, (weapon.damage / 100) * 100);
        const accuracyPercent = weapon.accuracy * 100;
        const fireRatePercent = Math.min(100, (weapon.fireRate / 800) * 100);
        const rangePercent = Math.min(100, (weapon.range / 100) * 100);
        
        // Update stat bars
        document.getElementById('damageStat').style.width = damagePercent + '%';
        document.getElementById('accuracyStat').style.width = accuracyPercent + '%';
        document.getElementById('fireRateStat').style.width = fireRatePercent + '%';
        document.getElementById('rangeStat').style.width = rangePercent + '%';
    }
    
    getCurrentWeapon() {
        const baseWeapon = { ...this.weaponTypes[this.currentWeapon] };
        
        // Apply attachment modifications
        this.currentAttachments.forEach(attachmentType => {
            const attachment = this.attachments[attachmentType];
            Object.keys(attachment).forEach(stat => {
                if (stat !== 'name' && baseWeapon.hasOwnProperty(stat)) {
                    baseWeapon[stat] += attachment[stat];
                }
            });
        });
        
        return baseWeapon;
    }
    
    canShoot() {
        if (this.isReloading || this.currentAmmo <= 0) return false;
        
        const weapon = this.getCurrentWeapon();
        const timeBetweenShots = 60000 / weapon.fireRate; // Convert RPM to ms
        
        return Date.now() - this.lastShotTime >= timeBetweenShots;
    }
    
    shoot() {
        if (!this.canShoot()) return false;
        
        this.currentAmmo--;
        this.lastShotTime = Date.now();
        
        // Add weapon recoil
        const weapon = this.getCurrentWeapon();
        const recoilAmount = weapon.recoil * (Math.random() * 0.5 + 0.5);
        
        // Apply recoil to camera (this would be handled by the game engine)
        
        return true;
    }
    
    reload() {
        if (this.isReloading || this.currentAmmo === this.weaponTypes[this.currentWeapon].ammo || this.reserveAmmo <= 0) {
            return false;
        }
        
        this.isReloading = true;
        this.reloadStartTime = Date.now();
        
        const weapon = this.getCurrentWeapon();
        setTimeout(() => {
            const ammoNeeded = this.weaponTypes[this.currentWeapon].ammo - this.currentAmmo;
            const ammoToReload = Math.min(ammoNeeded, this.reserveAmmo);
            
            this.currentAmmo += ammoToReload;
            this.reserveAmmo -= ammoToReload;
            this.isReloading = false;
        }, weapon.reloadTime * 1000);
        
        return true;
    }
    
    getCurrentAmmo() {
        return `${this.currentAmmo}/${this.reserveAmmo}`;
    }
    
    getCurrentWeaponName() {
        return this.weaponTypes[this.currentWeapon].name;
    }
    
    update(deltaTime) {
        // Update weapon animations, recoil recovery, etc.
        if (this.weaponModel) {
            // Simple weapon sway
            const time = Date.now() * 0.001;
            this.weaponModel.rotation.x = Math.sin(time * 2) * 0.01;
            this.weaponModel.rotation.y = Math.cos(time * 1.5) * 0.005;
        }
    }
}