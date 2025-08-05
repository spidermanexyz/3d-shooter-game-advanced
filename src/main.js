import * as THREE from 'three';
import { GameEngine } from './core/GameEngine.js';

// Global game instance
let game = null;

// Lobby state
let currentLobbySection = 'play';
let selectedGameMode = 'battle-royale';

// Initialize the game
async function initGame() {
    try {
        console.log('Initializing Advanced 3D Shooter...');
        
        // Hide loading screen and show start menu
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('lobbyContainer').style.display = 'block';
        
        // Setup lobby
        setupLobby();
        
        console.log('Game initialization complete!');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        document.querySelector('.loading-text').textContent = 'Failed to load game. Please refresh.';
    }
}

function setupLobby() {
    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchLobbySection(section);
        });
    });
    
    // Setup game mode selection
    document.querySelectorAll('.game-mode-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.game-mode-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedGameMode = card.dataset.mode;
            updatePlayButton();
        });
    });
    
    // Setup play button
    document.getElementById('lobbyPlayButton').addEventListener('click', () => {
        startGameFromLobby();
    });
    
    // Setup loadout items
    document.querySelectorAll('.loadout-item').forEach(item => {
        item.addEventListener('click', () => {
            const parent = item.parentElement;
            parent.querySelectorAll('.loadout-item').forEach(i => i.style.background = 'rgba(255, 255, 255, 0.1)');
            item.style.background = 'rgba(0, 255, 255, 0.2)';
        });
    });
    
    // Setup battle pass rewards
    document.querySelectorAll('.bp-reward').forEach(reward => {
        reward.addEventListener('click', () => {
            if (reward.classList.contains('unlocked')) {
                showRewardDetails(reward);
            }
        });
    });
    
    updatePlayButton();
}

function switchLobbySection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionName);
    });
    
    // Update sections
    document.querySelectorAll('.lobby-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    currentLobbySection = sectionName;
}

function updatePlayButton() {
    const playButton = document.getElementById('lobbyPlayButton');
    const modeNames = {
        'battle-royale': '🏆 ENTER BATTLE ROYALE',
        'team-deathmatch': '⚔️ JOIN TEAM DEATHMATCH',
        'capture-flag': '🚩 PLAY CAPTURE THE FLAG',
        'survival': '🧟 START SURVIVAL MODE',
        'ranked': '🏅 ENTER RANKED MATCH',
        'creative': '🎨 EXPLORE CREATIVE MODE'
    };
    
    playButton.textContent = modeNames[selectedGameMode] || '🚀 READY UP';
}

function showRewardDetails(reward) {
    // Create a simple popup for reward details
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        border: 2px solid #ffd700;
        border-radius: 15px;
        padding: 30px;
        z-index: 10000;
        text-align: center;
        min-width: 300px;
    `;
    
    popup.innerHTML = `
        <h3 style="color: #ffd700; margin-bottom: 15px;">Reward Unlocked!</h3>
        <div style="font-size: 3rem; margin-bottom: 15px;">${reward.textContent}</div>
        <p style="color: #ccc; margin-bottom: 20px;">You've unlocked this awesome reward!</p>
        <button onclick="this.parentElement.remove()" style="
            background: linear-gradient(45deg, #ffd700, #ffaa00);
            border: none;
            color: black;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        ">Close</button>
    `;
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        if (popup.parentElement) {
            popup.remove();
        }
    }, 3000);
}

function startGameFromLobby() {
    console.log(`Starting ${selectedGameMode} mode...`);
    
    // Hide lobby and start game
    document.getElementById('lobbyContainer').style.display = 'none';
    startGame();
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

// Global function to return to lobby
window.returnToLobby = function() {
    if (game) {
        game.stop();
        game = null;
    }
    
    document.getElementById('gameCanvas').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('lobbyContainer').style.display = 'block';
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