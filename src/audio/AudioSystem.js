export class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.sounds = {};
        this.isInitialized = false;
        
        console.log('AudioSystem initialized');
    }
    
    async init() {
        console.log('Initializing audio system...');
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3; // Master volume
            
            // Pre-generate sound effects
            this.generateSounds();
            
            this.isInitialized = true;
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Failed to initialize audio system:', error);
        }
    }
    
    generateSounds() {
        // Generate weapon sounds
        this.sounds.shoot = this.createShootSound();
        this.sounds.reload = this.createReloadSound();
        this.sounds.hit = this.createHitSound();
        this.sounds.enemyHit = this.createEnemyHitSound();
        this.sounds.footstep = this.createFootstepSound();
    }
    
    createShootSound() {
        return () => {
            if (!this.isInitialized) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // Configure oscillator
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
            
            // Configure filter
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
            
            // Configure gain
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            // Connect nodes
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            // Play
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    createReloadSound() {
        return () => {
            if (!this.isInitialized) return;
            
            // Create a series of clicks for reload sound
            const times = [0, 0.2, 0.4, 0.6];
            
            times.forEach(time => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + time);
                oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + time + 0.05);
                
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime + time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + time + 0.05);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.masterGain);
                
                oscillator.start(this.audioContext.currentTime + time);
                oscillator.stop(this.audioContext.currentTime + time + 0.05);
            });
        };
    }
    
    createHitSound() {
        return () => {
            if (!this.isInitialized) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
            
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(500, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }
    
    createEnemyHitSound() {
        return () => {
            if (!this.isInitialized) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }
    
    createFootstepSound() {
        return () => {
            if (!this.isInitialized) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    playShootSound() {
        if (this.sounds.shoot) {
            this.sounds.shoot();
        }
    }
    
    playReloadSound() {
        if (this.sounds.reload) {
            this.sounds.reload();
        }
    }
    
    playHitSound() {
        if (this.sounds.hit) {
            this.sounds.hit();
        }
    }
    
    playEnemyHitSound() {
        if (this.sounds.enemyHit) {
            this.sounds.enemyHit();
        }
    }
    
    playFootstepSound() {
        if (this.sounds.footstep) {
            this.sounds.footstep();
        }
    }
    
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    update(deltaTime) {
        // Audio system updates (if needed)
        if (this.audioContext && this.audioContext.state === 'suspended') {
            // Try to resume audio context if suspended
            this.audioContext.resume().catch(console.warn);
        }
    }
}