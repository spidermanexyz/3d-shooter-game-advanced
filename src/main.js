import * as THREE from 'three';
import { GameEngine } from './core/GameEngine.js';

// Global game instance
let game = null;

// Initialize the game
async function initGame() {
    try {
        console.log('Initializing Advanced 3D Shooter...');
        
        // Hide loading screen and show start menu
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('startMenu').style.display = 'flex';
        
        // Setup start button
        document.getElementById('startButton').addEventListener('click', startGame);
        
        console.log('Game initialization complete!');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        document.querySelector('.loading-text').textContent = 'Failed to load game. Please refresh.';
    }
}

async function startGame() {
    try {
        console.log('Starting game...');
        
        // Hide start menu
        document.getElementById('startMenu').style.display = 'none';
        
        // Show game canvas and UI
        document.getElementById('gameCanvas').style.display = 'block';
        document.getElementById('ui').style.display = 'block';
        
        // Initialize game engine
        game = new GameEngine();
        await game.init();
        
        // Start game loop
        game.start();
        
        console.log('Game started successfully!');
    } catch (error) {
        console.error('Failed to start game:', error);
        alert('Failed to start game. Please refresh and try again.');
    }
}

// Global functions for UI
window.toggleWeaponCustomization = function() {
    const panel = document.getElementById('weaponCustomization');
    const isVisible = panel.style.display === 'block';
    panel.style.display = isVisible ? 'none' : 'block';
    
    if (game) {
        game.setPaused(!isVisible);
    }
};

// Initialize when page loads
window.addEventListener('load', initGame);

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (game) {
        game.setPaused(document.hidden);
    }
});

console.log('Advanced 3D Shooter - Main script loaded');