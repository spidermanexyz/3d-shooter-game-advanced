export class UIManager {
    constructor() {
        this.elements = {};
        this.isCustomizationOpen = false;
        
        console.log('UIManager initialized');
    }
    
    async init() {
        console.log('Initializing UI manager...');
        
        // Cache UI elements
        this.elements = {
            health: document.getElementById('healthDisplay'),
            ammo: document.getElementById('ammoDisplay'),
            weapon: document.getElementById('weaponDisplay'),
            enemyCount: document.getElementById('enemyCount'),
            customization: document.getElementById('weaponCustomization')
        };
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('UI manager initialized');
    }
    
    setupEventListeners() {
        // Handle escape key for menu
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.togglePauseMenu();
            }
        });
        
        // Handle tab key for weapon customization
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Tab') {
                event.preventDefault();
                this.toggleWeaponCustomization();
            }
        });
        
        // Handle window focus/blur
        window.addEventListener('blur', () => {
            this.showPauseOverlay();
        });
        
        window.addEventListener('focus', () => {
            this.hidePauseOverlay();
        });
    }
    
    updateHUD(gameState) {
        // Update health
        if (this.elements.health) {
            this.elements.health.textContent = Math.max(0, Math.floor(gameState.health));
            
            // Change color based on health
            const healthPercent = gameState.health / 100;
            if (healthPercent > 0.6) {
                this.elements.health.style.color = '#00ff00';
            } else if (healthPercent > 0.3) {
                this.elements.health.style.color = '#ffff00';
            } else {
                this.elements.health.style.color = '#ff0000';
            }
        }
        
        // Update ammo
        if (this.elements.ammo) {
            this.elements.ammo.textContent = gameState.ammo;
        }
        
        // Update weapon name
        if (this.elements.weapon) {
            this.elements.weapon.textContent = gameState.weapon;
        }
        
        // Update enemy count
        if (this.elements.enemyCount) {
            this.elements.enemyCount.textContent = gameState.enemies;
        }
    }
    
    toggleWeaponCustomization() {
        this.isCustomizationOpen = !this.isCustomizationOpen;
        
        if (this.elements.customization) {
            this.elements.customization.style.display = 
                this.isCustomizationOpen ? 'block' : 'none';
        }
        
        // Toggle cursor
        document.body.style.cursor = this.isCustomizationOpen ? 'default' : 'none';
        
        return this.isCustomizationOpen;
    }
    
    togglePauseMenu() {
        // This would show/hide a pause menu
        // For now, just toggle weapon customization
        this.toggleWeaponCustomization();
    }
    
    showPauseOverlay() {
        // Show a pause overlay when window loses focus
        const overlay = document.createElement('div');
        overlay.id = 'pauseOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 2rem;
            z-index: 10000;
            pointer-events: all;
        `;
        overlay.innerHTML = '<div>GAME PAUSED<br><small>Click to resume</small></div>';
        
        overlay.addEventListener('click', () => {
            this.hidePauseOverlay();
        });
        
        document.body.appendChild(overlay);
    }
    
    hidePauseOverlay() {
        const overlay = document.getElementById('pauseOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    showDamageIndicator() {
        // Create a red flash effect when player takes damage
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 0, 0, 0.3);
            pointer-events: none;
            z-index: 999;
            animation: damageFlash 0.3s ease-out;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes damageFlash {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
            style.remove();
        }, 300);
    }
    
    showKillFeed(message) {
        // Show kill notifications
        const killFeed = document.getElementById('killFeed') || this.createKillFeed();
        
        const killMessage = document.createElement('div');
        killMessage.className = 'kill-message';
        killMessage.textContent = message;
        killMessage.style.cssText = `
            background: rgba(0, 255, 0, 0.2);
            border-left: 3px solid #00ff00;
            padding: 8px 12px;
            margin-bottom: 5px;
            border-radius: 4px;
            animation: slideIn 0.3s ease-out;
        `;
        
        killFeed.appendChild(killMessage);
        
        // Remove after 3 seconds
        setTimeout(() => {
            killMessage.remove();
        }, 3000);
    }
    
    createKillFeed() {
        const killFeed = document.createElement('div');
        killFeed.id = 'killFeed';
        killFeed.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            pointer-events: none;
            z-index: 1000;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(killFeed);
        return killFeed;
    }
    
    showScorePopup(score, position) {
        // Show floating score text
        const popup = document.createElement('div');
        popup.textContent = `+${score}`;
        popup.style.cssText = `
            position: fixed;
            color: #00ff00;
            font-size: 1.5rem;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            text-shadow: 0 0 10px #00ff00;
            animation: scoreFloat 1s ease-out forwards;
        `;
        
        // Convert 3D position to screen coordinates (simplified)
        popup.style.left = (window.innerWidth / 2 + Math.random() * 100 - 50) + 'px';
        popup.style.top = (window.innerHeight / 2 + Math.random() * 100 - 50) + 'px';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scoreFloat {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(-50px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.remove();
            style.remove();
        }, 1000);
    }
    
    updateCrosshair(accuracy) {
        // Adjust crosshair size based on weapon accuracy
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            const size = Math.max(10, 30 - (accuracy * 20));
            crosshair.style.width = size + 'px';
            crosshair.style.height = size + 'px';
        }
    }
}