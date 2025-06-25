class TrackingSystem {
    constructor() {
        this.isRunning = false;
        this.isTracking = false;
        this.startTime = null;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        
        this.canvas = document.getElementById('trackingCanvas');
        this.ctx = this.canvas.getContext('2d');
     
        this.settings = {
            confidenceThreshold: 0.4,
            iouThreshold: 0.5,
            interceptorSpeed: 6.0,
            interceptionRange: 20.0,
            updateRate: 30,
            showTrails: true
        };
        
        // Simulation data
        this.target = { x: 320, y: 240, vx: 7, vy: 6 };
        this.interceptor = { x: 100, y: 100, vx: 0, vy: 0 };
        this.targetTrail = [];
        this.interceptorTrail = [];
        this.detectionCount = 0;
        
        // Animation
        this.animationId = null;
        
        this.initializeEventListeners();
        this.initializeCanvas();
        this.startUpdateLoop();
    }
    
    initializeEventListeners() {
        // System controls
        document.getElementById('startSystem').addEventListener('click', () => this.startSystem());
        document.getElementById('stopSystem').addEventListener('click', () => this.stopSystem());
        document.getElementById('resetSystem').addEventListener('click', () => this.resetSystem());
        document.getElementById('emergencyStop').addEventListener('click', () => this.emergencyStop());
        
        // Tracking toggle
        document.getElementById('trackingToggle').addEventListener('click', () => this.toggleTracking());
        
        // Sliders
        this.setupSlider('confidenceSlider', 'confidenceValue', 'confidenceThreshold');
        this.setupSlider('iouSlider', 'iouValue', 'iouThreshold');
        this.setupSlider('speedSlider', 'speedValue', 'interceptorSpeed');
        this.setupSlider('rangeSlider', 'rangeValue', 'interceptionRange');
        this.setupSlider('updateRateSlider', 'updateRateValue', 'updateRate');
        
        // Tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Show trails checkbox
        document.getElementById('showTrails').addEventListener('change', (e) => {
            this.settings.showTrails = e.target.checked;
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.toggleTracking();
                    break;
                case 'KeyR':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.resetSystem();
                    }
                    break;
                case 'Escape':
                    this.emergencyStop();
                    break;
            }
        });
    }
    
    setupSlider(sliderId, valueId, settingKey) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.settings[settingKey] = value;
            valueDisplay.textContent = value;
        });
    }
    
    initializeCanvas() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    startSystem() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = Date.now();
            this.updateSystemStatus('System Active', 'active');
            this.resetPositions();
        }
    }
    
    stopSystem() {
        this.isRunning = false;
        this.isTracking = false;
        this.updateSystemStatus('System Stopped', 'inactive');
        this.updateTrackingButton();
        this.settings = {
            confidenceThreshold: 0.4,
            iouThreshold: 0.5,
            interceptorSpeed: 6.0,
            interceptionRange: 20.0,
            updateRate: 30,
            showTrails: true
        };
        
    }
    
    resetSystem() {
        this.stopSystem();
        this.resetPositions();
        this.targetTrail = [];
        this.interceptorTrail = [];
        this.detectionCount = 0;
        this.frameCount = 0;
        this.updateSystemStatus('System Ready', 'ready');
        this.initializeCanvas();
        this.updateMetrics();
    }
    
    emergencyStop() {
        this.stopSystem();
        this.updateSystemStatus('Emergency Stop', 'error');
    }
    
    toggleTracking() {
        if (!this.isRunning) {
            this.startSystem();
        }
        
        this.isTracking = !this.isTracking;
        this.updateTrackingButton();
        
        if (this.isTracking) {
            this.updateSystemStatus('Tracking Active', 'active');
            this.simulateDetection();
        } else {
            this.updateSystemStatus('System Active', 'active');
        }
    }
    
    updateTrackingButton() {
        const button = document.getElementById('trackingToggle');
        if (this.isTracking) {
            button.textContent = 'Stop Tracking';
            button.className = 'btn btn--secondary btn--lg';
        } else {
            button.textContent = 'Start Tracking';
            button.className = 'btn btn--primary btn--lg';
        }
    }
    
    updateSystemStatus(text, status) {
        const statusText = document.getElementById('systemStatusText');
        const statusDot = document.getElementById('systemStatus');
        
        statusText.textContent = text;
        statusDot.className = `status-dot ${status === 'error' ? 'error' : status === 'inactive' ? 'inactive' : ''}`;
    }
    
    resetPositions() {
        this.target = { 
            x: Math.random() * 500 + 70, 
            y: Math.random() * 300 + 90,
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.5) * 16
        };
        this.interceptor = { x: 100, y: 100, vx: 0, vy: 0 };
    }
    
    simulateDetection() {
        const detectionBox = document.getElementById('detectionBox');
        const videoContainer = document.querySelector('.video-placeholder');
        
        if (this.isTracking) {
            // Simulate detection box
            const boxWidth = 80 + Math.random() * 40;
            const boxHeight = 60 + Math.random() * 30;
            const boxX = Math.random() * (videoContainer.offsetWidth - boxWidth);
            const boxY = Math.random() * (videoContainer.offsetHeight - boxHeight);
            
            detectionBox.style.left = boxX + 'px';
            detectionBox.style.top = boxY + 'px';
            detectionBox.style.width = boxWidth + 'px';
            detectionBox.style.height = boxHeight + 'px';
            detectionBox.style.display = 'block';
            
            this.detectionCount = Math.floor(Math.random() * 3) + 1;
            document.getElementById('detectionCount').textContent = this.detectionCount;
        } else {
            detectionBox.style.display = 'none';
            this.detectionCount = 0;
            document.getElementById('detectionCount').textContent = this.detectionCount;
        }
    }
    
    updateSimulation() {
        if (!this.isRunning) return;
        
        this.target.x += this.target.vx;
        this.target.y += this.target.vy;
        
        // Bounce off walls
        if (this.target.x <= 10 || this.target.x >= this.canvas.width - 10) {
            this.target.vx *= -1;
        }
        if (this.target.y <= 10 || this.target.y >= this.canvas.height - 10) {
            this.target.vy *= -1;
        }
        
        // Keep target in bounds
        this.target.x = Math.max(10, Math.min(this.canvas.width - 10, this.target.x));
        this.target.y = Math.max(10, Math.min(this.canvas.height - 10, this.target.y));
        
        if (this.isTracking) {
            
            const dx = this.target.x - this.interceptor.x;
            const dy = this.target.y - this.interceptor.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.settings.interceptionRange) {
                const speed = this.settings.interceptorSpeed;
                this.interceptor.vx = (dx / distance) * speed;
                this.interceptor.vy = (dy / distance) * speed;
                
                this.interceptor.x += this.interceptor.vx;
                this.interceptor.y += this.interceptor.vy;
            }
            
            // Update trails
            if (this.settings.showTrails) {
                this.targetTrail.push({ x: this.target.x, y: this.target.y });
                this.interceptorTrail.push({ x: this.interceptor.x, y: this.interceptor.y });
                
                // Limit trail length
                if (this.targetTrail.length > 50) this.targetTrail.shift();
                if (this.interceptorTrail.length > 50) this.interceptorTrail.shift();
            }
            
             if (distance <= this.settings.interceptionRange) {
                if(this.interceptor.vx<this.target.vx && this.interceptor.vy<this.target.vy)
                {
                    this.settings.interceptorSpeed=9;
                    this.updateSystemStatus('Increasing Speed to Intercept', 'active');
                }
                
            }
          if (distance <= this.settings.interceptionRange&&this.interceptor.vx>=this.target.vx && this.interceptor.vy>=this.target.vy) {
              this.updateSystemStatus('Target Intercepted', 'active');
            }
            
            // Update distance display
            document.getElementById('distanceValue').textContent = Math.round(distance);
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        if (this.isRunning) {
            // Draw trails
            if (this.settings.showTrails && this.isTracking) {
                this.drawTrail(this.targetTrail, '#4FC3F7', 0.3);
                this.drawTrail(this.interceptorTrail, '#FF5722', 0.3);
            }
            
            // Draw interception range
            if (this.isTracking) {
                this.ctx.strokeStyle = '#FF5722';
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = 0.3;
                this.ctx.beginPath();
                this.ctx.arc(this.interceptor.x, this.interceptor.y, this.settings.interceptionRange, 0, 2 * Math.PI);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
            
            // Draw target
            this.ctx.fillStyle = '#4FC3F7';
            this.ctx.beginPath();
            this.ctx.arc(this.target.x, this.target.y, 8, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw target direction indicator
            if (this.isTracking) {
                this.ctx.strokeStyle = '#4FC3F7';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(this.target.x, this.target.y);
                this.ctx.lineTo(this.target.x + this.target.vx * 10, this.target.y + this.target.vy * 10);
                this.ctx.stroke();
            }
            
            // Draw interceptor
            this.ctx.fillStyle = '#FF5722';
            this.ctx.beginPath();
            this.ctx.arc(this.interceptor.x, this.interceptor.y, 6, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw interceptor direction indicator
            if (this.isTracking && (this.interceptor.vx !== 0 || this.interceptor.vy !== 0)) {
                this.ctx.strokeStyle = '#FF5722';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(this.interceptor.x, this.interceptor.y);
                this.ctx.lineTo(this.interceptor.x + this.interceptor.vx * 8, this.interceptor.y + this.interceptor.vy * 8);
                this.ctx.stroke();
            }
        }
    }
    
    drawTrail(trail, color, alpha) {
        if (trail.length < 2) return;
        
        this.ctx.strokeStyle = color;
        this.ctx.globalAlpha = alpha;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        for (let i = 0; i < trail.length; i++) {
            if (i === 0) {
                this.ctx.moveTo(trail[i].x, trail[i].y);
            } else {
                this.ctx.lineTo(trail[i].x, trail[i].y);
            }
        }
        
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
    
    updateMetrics() {
        // Update coordinates
        document.getElementById('targetCoords').textContent = 
            `${Math.round(this.target.x)}, ${Math.round(this.target.y)}`;
        document.getElementById('interceptorCoords').textContent = 
            `${Math.round(this.interceptor.x)}, ${Math.round(this.interceptor.y)}`;
        
        // Update uptime
        if (this.startTime) {
            const uptime = Math.floor((Date.now() - this.startTime) / 1000);
            const hours = Math.floor(uptime / 3600).toString().padStart(2, '0');
            const minutes = Math.floor((uptime % 3600) / 60).toString().padStart(2, '0');
            const seconds = (uptime % 60).toString().padStart(2, '0');
            document.getElementById('uptime').textContent = `${hours}:${minutes}:${seconds}`;
        }
        
        // Update processing FPS
        document.getElementById('processingFps').textContent = Math.round(this.getCurrentFPS());
    }
    
    getCurrentFPS() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        return delta > 0 ? 1000 / delta : 0;
    }
    
    updateFPSCounter() {
        this.frameCount++;
        if (this.frameCount % 30 === 0) { // Update every 30 frames
            const fps = this.getCurrentFPS();
            document.getElementById('fpsCounter').textContent = Math.round(fps);
        }
    }
    
    switchTab(tabName) {
       
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }
    
    startUpdateLoop() {
        const update = () => {
            this.updateSimulation();
            this.draw();
            this.updateMetrics();
            this.updateFPSCounter();
            
            if (this.isTracking && Math.random() < 0.1) {
                this.simulateDetection();
            }
            
            this.animationId = requestAnimationFrame(update);
        };
        update();
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const trackingSystem = new TrackingSystem();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        trackingSystem.destroy();
    });
    
    console.log('Object Tracking & Interception System initialized');
    console.log('Keyboard shortcuts:');
    console.log('  Space: Start/Stop tracking');
    console.log('  Ctrl+R: Reset system');
    console.log('  Escape: Emergency stop');
});