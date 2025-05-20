let deferredPrompt = null;
const installButton = document.getElementById('install-button');
const installContainer = document.getElementById('install-container');
const installStatus = document.getElementById('install-status');

// Check if app is already installed
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Show status message
function showStatus(message, type = 'info') {
    if (installStatus) {
        installStatus.textContent = message;
        installStatus.className = `status-${type}`;
        installStatus.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            installStatus.style.display = 'none';
        }, 5000);
    }
}

// Show install button
function showInstallButton() {
    if (installContainer && !isAppInstalled()) {
        installContainer.style.display = 'block';
        showStatus('This app can be installed on your device!', 'info');
    }
}

// Hide install button
function hideInstallButton() {
    if (installContainer) {
        installContainer.style.display = 'none';
    }
}

// Handle install button click
function handleInstallClick() {
    if (!deferredPrompt) {
        showStatus('Install prompt not available', 'warning');
        return;
    }

    // Hide the install button
    hideInstallButton();

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            showStatus('App installation started...', 'success');
            console.log('User accepted the install prompt');
        } else {
            showStatus('Installation cancelled', 'warning');
            console.log('User dismissed the install prompt');
            // Show the button again if user cancelled
            setTimeout(showInstallButton, 3000);
        }
        deferredPrompt = null;
    });
}

// Event listeners for PWA installation
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Save the event for later use
    deferredPrompt = e;
    
    // Show the install button
    showInstallButton();
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed successfully');
    showStatus('App installed successfully! 🎉', 'success');
    hideInstallButton();
    deferredPrompt = null;
});

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('New service worker available');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content available
                            showStatus('New version available! Refresh to update.', 'info');
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
                showStatus('Service Worker registration failed', 'warning');
            });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener to install button
    if (installButton) {
        installButton.addEventListener('click', handleInstallClick);
    }
    
    // Check if app is already installed
    if (isAppInstalled()) {
        showStatus('App is running in installed mode! 🚀', 'success');
        hideInstallButton();
    } else {
        console.log('App is running in browser mode');
        // Don't show install button immediately - wait for beforeinstallprompt
    }
    
    // Check for iOS devices (which don't support beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = window.navigator.standalone;
    
    if (isIOS && !isInStandaloneMode) {
        // Show manual install instructions for iOS
        if (installContainer) {
            installContainer.innerHTML = `
                <h3>📱 Install this app on iOS</h3>
                <p>Tap the <strong>Share</strong> button <span style="font-size: 1.2em;">⎋</span> in Safari, then select <strong>"Add to Home Screen"</strong> 📲</p>
            `;
            installContainer.style.display = 'block';
        }
    }
});