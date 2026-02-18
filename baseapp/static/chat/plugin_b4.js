/**
 * GenAiChatPlugin - A flexible chat widget for AI-powered conversations
 * Version 1.0.1
 */
class GenAiChatPlugin {
    constructor(options = {}) {
        // Create a shadow DOM container to isolate our component
        this.rootContainer = document.createElement('div');
        this.rootContainer.id = 'gen-ai-chat-container';
        document.body.appendChild(this.rootContainer);

        // Create shadow DOM
        this.shadow = this.rootContainer.attachShadow({ mode: 'open' });

        // Base configuration
        this.serverUrl = options.serverUrl || 'https://your-django-server.com';
        this.chatName = options.chatName || 'Chat';
        this.defaultGreeting = options.defaultGreeting || 'Olá! Como o posso ajudar?';
        this.defaultSender = options.defaultSender || 'Valéria';
        this.containerElement = null;
        this.csrfToken = null;
        this.translations = options.translations || {
            send: 'Send'
        };
        this.enableFeedback = options.enableFeedback !== undefined ? options.enableFeedback : true;

        // CSRF configuration
        this.csrfHeaderName = options.csrfHeaderName || 'X-CSRFToken';
        this.csrfCookieName = options.csrfCookieName || 'csrftoken';
        this.disableCsrf = options.disableCsrf !== undefined ? options.disableCsrf : true;

        // User parameters
        this.userEmail = options.userEmail || '';
        this.userName = options.userName || '';
        this.userToken = options.userToken || '';
        this.language = options.language || 'en';
        this.sourceApp = options.sourceApp || '';
        this.browserSession = options.browserSession || this.generateSessionId();
        this.formatMessage = options.formatMessage !== undefined ? options.formatMessage : true;

        // Debug mode for troubleshooting
        this.debug = options.debug || false;

        // Initialize the plugin
        this.init();
    }

    // Generate a unique session ID if none is provided
    generateSessionId() {
        const timestamp = new Date().getTime();
        const randomNum = Math.floor(Math.random() * 10000);
        return `session_${timestamp}_${randomNum}`;
    }

    async init() {
        // Load CSS resources into shadow DOM
        this.loadStyles();

        // Create UI components
        this.createChatButton();
        this.createChatInterface();

        // Set up button attention timeout
        this.setupButtonAttentionTimeout();

        // Set up event listeners
        this.setupEventListeners();

        // Get initial CSRF token and load messages
        await this.fetchCsrfToken();
        await this.loadMessages();
    }

    loadStyles() {


        // Create styleSheet for the shadow DOM
        const style = document.createElement('style');

        style.textContent = `
            /* Import Bootstrap Icons via @import */
            @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css');

            /* Import Bootstrap CSS via @import */
            @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css');

            /* Button animations */
            @keyframes shakeButton {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }

            @keyframes pulseButton {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7); }
                70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(0, 123, 255, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
            }

            @keyframes blinkButton {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .chat-button-attention-shake {
                animation: shakeButton 0.8s cubic-bezier(.36,.07,.19,.97) infinite;
            }

            .chat-button-attention-pulse {
                animation: pulseButton 1.5s infinite;
            }

            .chat-button-attention-blink {
                animation: blinkButton 1s infinite;
            }

            /* Chat UI styles */
            .chat-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                z-index: 1000;
                border-radius: 50%;
                background-color: #007bff;
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }

            .chat-button:hover {
                transform: scale(1.05);
                background-color: #0069d9;
            }

            .chat-button i {
                font-size: 24px;
            }

            .modal {
                display: none;
                position: fixed;
                z-index: 1050;
                right: 0;
                bottom: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                outline: 0;
            }

            .modal.show {
                display: block;
            }

            .modal-dialog-right {
                position: fixed;
                right: 20px;
                bottom: 100px;
                margin: 0;
                width: 350px;
                transform: translateX(100%);
                transition: transform 0.3s ease-out;
            }

            .modal.show .modal-dialog-right {
                transform: translateX(0);
            }

            .modal-content {
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                position: relative;
                display: flex;
                flex-direction: column;
                width: 100%;
                background-color: white;
                pointer-events: auto;
                background-clip: padding-box;
                border: 1px solid rgba(0,0,0,.2);
                outline: 0;
            }

            .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                border-bottom: 1px solid #dee2e6;
                border-top-right-radius: 15px;
                border-top-left-radius: 15px;
            }

            .modal-title {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 500;
            }

            .btn-close {
                padding: 0.5rem;
                margin: -0.5rem -0.5rem -0.5rem auto;
                background: transparent url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/%3e%3c/svg%3e") center/1em auto no-repeat;
                border: 0;
                border-radius: 0.25rem;
                opacity: .5;
                cursor: pointer;
            }

            .btn-close:hover {
                opacity: .75;
            }

            .modal-body {
                position: relative;
                flex: 1 1 auto;
                padding: 1rem;
            }

            .chat-messages {
                height: 350px;
                overflow-y: auto;
                padding: 15px;
            }

            .message {
                margin-bottom: 15px;
                max-width: 80%;
            }

            .message-sent {
                margin-left: auto;
            }

            .message-received {
                margin-right: auto;
            }

            .message-content {
                padding: 10px;
                border-radius: 15px;
                background-color: #f8f9fa;
            }

            .message-sent .message-content {
                background-color: #007bff;
                color: white;
            }

            .message-info {
                font-size: 0.8em;
                color: #6c757d;
                margin-top: 5px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .message-feedback {
                display: flex;
                gap: 5px;
            }

            .feedback-icon {
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.2s ease;
            }

            .feedback-icon:hover {
                opacity: 1;
            }

            .form-control {
                display: block;
                width: 100%;
                padding: 0.375rem 0.75rem;
                font-size: 1rem;
                font-weight: 400;
                line-height: 1.5;
                color: #212529;
                background-color: #fff;
                background-clip: padding-box;
                border: 1px solid #ced4da;
                appearance: none;
                border-radius: 0.25rem;
                transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
            }

            .input-group {
                position: relative;
                display: flex;
                flex-wrap: wrap;
                align-items: stretch;
                width: 100%;
            }

            .btn {
                cursor: pointer;
                display: inline-block;
                font-weight: 400;
                line-height: 1.5;
                text-align: center;
                vertical-align: middle;
                border: 1px solid transparent;
                padding: 0.375rem 0.75rem;
                font-size: 1rem;
                border-radius: 0.25rem;
                transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
            }

            .btn-primary {
                color: #fff;
                background-color: #007bff;
                border-color: #007bff;
            }

            .btn-primary:hover {
                color: #fff;
                background-color: #0069d9;
                border-color: #0062cc;
            }

            .btn-sending {
                position: relative;
                pointer-events: none;
                opacity: 0.65;
            }

            .spinner-border {
                display: inline-block;
                width: 1rem;
                height: 1rem;
                vertical-align: text-bottom;
                border: 0.25em solid currentColor;
                border-right-color: transparent;
                border-radius: 50%;
                animation: spinner-border .75s linear infinite;
            }

            @keyframes spinner-border {
                to { transform: rotate(360deg); }
            }

            /* Typing indicator styles */
            .typing-indicator {
                margin-bottom: 15px;
                max-width: 80%;
                margin-right: auto;
            }

            .typing-indicator .message-content {
                padding: 10px;
                border-radius: 15px;
                background-color: #f8f9fa;
                display: flex;
                align-items: center;
            }

            .typing-dots {
                display: inline-flex;
                align-items: center;
            }

            .typing-dot {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #6c757d;
                margin: 0 2px;
                animation: typing-dot-pulse 1.4s infinite ease-in-out;
            }

            .typing-dot:nth-child(1) { animation-delay: 0s; }
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }

            @keyframes typing-dot-pulse {
                0%, 60%, 100% { transform: scale(1); opacity: 0.6; }
                30% { transform: scale(1.2); opacity: 1; }
            }
        `;

        this.shadow.appendChild(style);
    }

     createChatButton() {
            const button = document.createElement('button');
            button.id = 'chatButton';
            button.className = 'chat-button';

            // Use an SVG instead of Bootstrap Icon
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                    <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9.06 9.06 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 0 1-.524 2.318l-.003.011a10.722 10.722 0 0 1-.244.637c-.079.186.074.394.273.362a21.673 21.673 0 0 0 .693-.125zm.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6c0 3.193-3.004 6-7 6a8.06 8.06 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a10.97 10.97 0 0 0 .398-2z"/>
                </svg>
            `;
            this.shadow.appendChild(button);
        }

    createChatInterface() {
        this.containerElement = document.createElement('div');
        this.containerElement.innerHTML = `
            <div class="modal" id="chatModal" tabindex="-1" aria-labelledby="chatModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-right">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="chatModalLabel">${this.chatName}</h5>
                            <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="chat-messages" id="chatMessages">
                                <div class="message message-received">
                                    <div class="message-content">${this.defaultGreeting}</div>
                                    <div class="message-info">
                                        <small>${this.defaultSender} - ${this.getCurrentTimestamp()}</small>
                                    </div>
                                </div>
                            </div>
                            <form id="chatForm" class="chat-form mt-3">
                                <div class="input-group">
                                    <input type="text" class="form-control" id="messageInput" placeholder="Type your message...">
                                    <button class="btn btn-primary" type="submit" id="sendButton">${this.translations.send}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.shadow.appendChild(this.containerElement);
    }

    setupEventListeners() {
        // Get button and modal elements from shadow DOM
        const button = this.shadow.getElementById('chatButton');
        const modal = this.shadow.getElementById('chatModal');
        const closeButton = this.shadow.querySelector('.btn-close');
        const chatForm = this.shadow.getElementById('chatForm');

        // Toggle modal when button is clicked
        button.addEventListener('click', () => {
            modal.classList.toggle('show');
            this.removeButtonAttention();

            // Clear timeout if it hasn't fired yet
            if (this.buttonAttentionTimeout) {
                clearTimeout(this.buttonAttentionTimeout);
                this.buttonAttentionTimeout = null;
            }
        });

        // Close modal when close button is clicked
        closeButton.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        // Add form submit handler
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = this.shadow.getElementById('messageInput');
            const content = input.value.trim();

            if (content) {
                // Disable form elements and show loading state
                this.setFormLoadingState(true);

                try {
                    await this.sendMessage(content);
                    input.value = '';
                } catch (error) {
                    console.error('Failed to send message:', error);
                    // Optionally show error to user here
                } finally {
                    // Re-enable form elements and remove loading state
                    this.setFormLoadingState(false);
                }
            }
        });

        // Add event delegation for feedback icons
        this.shadow.addEventListener('click', async (e) => {
            if (e.target.classList.contains('feedback-icon')) {
                const messageId = e.target.getAttribute('data-message-id');
                const feedback = e.target.getAttribute('data-feedback');

                if (messageId && feedback) {
                    // Change the appearance of the clicked icon
                    e.target.style.opacity = '1';

                    // Change the color based on feedback type
                    if (feedback === 'positive') {
                        e.target.style.color = '#28a745'; // Green
                        // Find the negative feedback icon and disable it
                        const negativeIcon = this.shadow.querySelector(`.feedback-icon[data-message-id="${messageId}"][data-feedback="negative"]`);
                        if (negativeIcon) {
                            negativeIcon.style.opacity = '0.3';
                            negativeIcon.style.cursor = 'default';
                            negativeIcon.classList.remove('feedback-icon');
                            negativeIcon.classList.add('feedback-icon-disabled');
                        }
                    } else {
                        e.target.style.color = '#dc3545'; // Red
                        // Find the positive feedback icon and disable it
                        const positiveIcon = this.shadow.querySelector(`.feedback-icon[data-message-id="${messageId}"][data-feedback="positive"]`);
                        if (positiveIcon) {
                            positiveIcon.style.opacity = '0.3';
                            positiveIcon.style.cursor = 'default';
                            positiveIcon.classList.remove('feedback-icon');
                            positiveIcon.classList.add('feedback-icon-disabled');
                        }
                    }

                    try {
                        // Send feedback to server
                        await this.sendFeedback(messageId, feedback);
                    } catch (error) {
                        console.error('Failed to send feedback:', error);
                    }
                }
            }
        });
    }

    setupButtonAttentionTimeout() {
        // Set timeout to add attention-grabbing animation after 5 seconds
        this.buttonAttentionTimeout = setTimeout(() => {
            this.addButtonAttention();
            // Also play a notification sound
            this.playNotificationSound();
        }, 5000);
    }

    addButtonAttention() {
        const button = this.shadow.getElementById('chatButton');
        if (button) {
            // Randomly choose one of the three animation styles
            const animations = ['shake', 'pulse', 'blink'];
            const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
            button.classList.add(`chat-button-attention-${randomAnimation}`);
        }
    }

    removeButtonAttention() {
        const button = this.shadow.getElementById('chatButton');
        if (button) {
            button.classList.remove('chat-button-attention-shake', 'chat-button-attention-pulse', 'chat-button-attention-blink');
        }
    }

    playNotificationSound() {
        // Create and play a simple notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Start the sound
            oscillator.start();

            // Fade out and stop after a short duration
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.error('Failed to play notification sound:', error);
            // Continue without sound if it fails
        }
    }

    getCurrentTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    setFormLoadingState(isLoading) {
        const input = this.shadow.getElementById('messageInput');
        const sendButton = this.shadow.getElementById('sendButton');

        if (isLoading) {
            input.disabled = true;
            sendButton.disabled = true;
            sendButton.classList.add('btn-sending');
            sendButton.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Sending...
            `;
        } else {
            input.disabled = false;
            sendButton.disabled = false;
            sendButton.classList.remove('btn-sending');
            sendButton.innerHTML = this.translations.send;
        }
    }

    async fetchCsrfToken() {
        try {
            // Method 1: Try to get CSRF token from cookie first
            const getCookieValue = (name) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
            };

            // Try multiple possible cookie names for CSRF token
            let csrfToken = getCookieValue('csrftoken') ||
                            getCookieValue('CSRF-TOKEN') ||
                            getCookieValue('XSRF-TOKEN') ||
                            getCookieValue('X-CSRF-Token');

            if (csrfToken) {
                this.csrfToken = csrfToken;
                if (this.debug) console.log('CSRF token found in cookie:', this.csrfToken);
                return;
            }

            // Method 2: Try to get CSRF token from meta tag
            const metaToken = document.querySelector('meta[name="csrf-token"]');
            if (metaToken) {
                this.csrfToken = metaToken.getAttribute('content');
                if (this.debug) console.log('CSRF token found in meta tag:', this.csrfToken);
                return;
            }

            // Method 3: Try to get from Django form if present
            const csrfTokenElement = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (csrfTokenElement) {
                this.csrfToken = csrfTokenElement.value;
                if (this.debug) console.log('CSRF token found in form:', this.csrfToken);
                return;
            }

            // Method 4: If not found, try to fetch from server
            if (this.debug) console.log('Attempting to fetch CSRF token from server...');
            const response = await fetch(`${this.serverUrl}/chat/csrf/`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': window.location.origin
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.csrf_token) {
                this.csrfToken = data.csrf_token;
                document.cookie = `csrftoken=${data.csrf_token};path=/;SameSite=Lax`;
                if (this.debug) console.log('CSRF token fetched from server:', this.csrfToken);
                return;
            } else {
                throw new Error('Server did not provide a CSRF token');
            }
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
            // If we get here, we couldn't get a CSRF token
            // We'll try to continue anyway, but warn in the console
            console.warn('Could not obtain CSRF token. Requests might fail with 403 errors.');

            if (this.debug) {
                // Add a message in the chat for debugging purposes
                const errorMessage = {
                    content: "Warning: CSRF token could not be obtained. Some features might not work correctly.",
                    _message_type: 'received'
                };
                this.appendMessage(errorMessage);
            }
        }
    }

    async loadMessages() {
        try {
            // Prepare headers
            const headers = {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': window.location.origin
            };

            // Add CSRF token if not disabled
            if (this.csrfToken && !this.disableCsrf) {
                headers['X-CSRFToken'] = this.csrfToken;
                // Add the custom CSRF header name if provided
                if (this.csrfHeaderName) {
                    headers[this.csrfHeaderName] = this.csrfToken;
                }
            }

            if (this.debug) {
                console.log('Loading messages with URL:', `${this.serverUrl}/chat/messages/`);
                console.log('Request headers:', headers);
            }

            // Add browser_session as query parameter
            const url = new URL(`${this.serverUrl}/chat/messages/`);
            url.searchParams.append('browser_session', this.browserSession);

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const messages = await response.json();
            this.displayMessages(messages);

            if (this.debug) {
                console.log('Loaded messages:', messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            // Keep the default greeting if we can't load messages
        }
    }

    async sendFeedback(messageId, feedback) {
        try {
            // Ensure we have a fresh CSRF token
            await this.fetchCsrfToken();

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': window.location.origin
            };

            // Add CSRF token if not disabled
            if (this.csrfToken && !this.disableCsrf) {
                headers['X-CSRFToken'] = this.csrfToken;
                // Add the custom CSRF header name if provided
                if (this.csrfHeaderName) {
                    headers[this.csrfHeaderName] = this.csrfToken;
                }
            }

            const response = await fetch(`${this.serverUrl}/chat/feedback/`, {
                method: 'POST',
                credentials: 'include',
                headers: headers,
                mode: 'cors',
                body: JSON.stringify({
                    message_id: messageId,
                    feedback: feedback,
                    browser_session: this.browserSession,
                    source_app: this.sourceApp
                })
            });

            if (!response.ok) {
                console.error('Server response not OK:', response.status);
                const errorText = await response.text();
                console.error('Error details:', errorText);
                throw new Error('Failed to send feedback');
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending feedback:', error);
            throw error;
        }
    }

    // Format the message to include user details if formatMessage is true
    formatMessageWithUserDetails(content) {
        if (!this.formatMessage) {
            return content;
        }

        // Format: Question: [content]; User details: [details]
        const userDetails = {
            name: this.userName,
            email: this.userEmail,
            token: this.userToken,
            language: this.language,
            session: this.browserSession,
            source: this.sourceApp
        };

        const detailsString = Object.entries(userDetails)
            .filter(([_, value]) => value) // Only include non-empty values
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        return `Question: ${content}; User details: ${detailsString}`;
    }

    // Show typing indicator with blinking dots
    showTypingIndicator() {
        const container = this.shadow.getElementById('chatMessages');
        const indicatorId = 'typing-indicator-' + Date.now();

        const indicatorHtml = `
            <div class="typing-indicator" id="${indicatorId}">
                <div class="message-content">
                    <div class="typing-dots">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                </div>
                <div class="message-info">
                    <small>${this.defaultSender} - ${this.getCurrentTimestamp()}</small>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', indicatorHtml);
        container.scrollTop = container.scrollHeight;

        return indicatorId;
    }

    // Remove typing indicator
    hideTypingIndicator(indicatorId) {
        const indicator = this.shadow.getElementById(indicatorId);
        if (indicator) {
            indicator.remove();
        }
    }

    async sendMessage(content) {
        try {
            // First ensure we have a fresh CSRF token
            await this.fetchCsrfToken();

            if (this.debug) {
                console.log('message sent');
                console.log(this.browserSession);
            }

            // Format the message content to include user details if needed
            const formattedContent = this.formatMessageWithUserDetails(content);

            // Immediately display the user's message (show original content to user, not formatted)
            const userMessage = {
                content: content,
                _message_type: 'sent'
            };
            this.appendMessage(userMessage);

            // Show typing indicator after user message is sent
            const indicatorId = this.showTypingIndicator();

            try {
                // Prepare headers
                const headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': window.location.origin
                };

                // Add CSRF token with multiple possible header names if CSRF is not disabled
                if (this.csrfToken && !this.disableCsrf) {
                    headers['X-CSRFToken'] = this.csrfToken;
                    headers['X-CSRF-Token'] = this.csrfToken;
                    headers['CSRF-Token'] = this.csrfToken;
                    headers['X-XSRF-TOKEN'] = this.csrfToken;

                    // Also add the custom CSRF header name if provided
                    if (this.csrfHeaderName && !headers[this.csrfHeaderName]) {
                        headers[this.csrfHeaderName] = this.csrfToken;
                    }
                }

                if (this.debug) {
                    console.log('Sending message to server with URL:', `${this.serverUrl}/chat/send/`);
                    console.log('CSRF token:', this.csrfToken);
                    console.log('Request headers:', headers);
                    console.log('Request payload:', {
                        message: formattedContent,
                        user_email: this.userEmail,
                        user_name: this.userName,
                        user_token: this.userToken,
                        language: this.language,
                        browser_session: this.browserSession,
                        source_app: this.sourceApp
                    });
                }

                const response = await fetch(`${this.serverUrl}/chat/send/`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: headers,
                    mode: 'cors',
                    body: JSON.stringify({
                        message: formattedContent,
                        user_email: this.userEmail,
                        user_name: this.userName,
                        user_token: this.userToken,
                        language: this.language,
                        browser_session: this.browserSession,
                        source_app: this.sourceApp
                    })
                });

                // Remove typing indicator before showing the response
                this.hideTypingIndicator(indicatorId);

                if (response.ok) {
                    const responseData = await response.json();

                    // Format the server response for our internal message format
                    const message = {
                        content: responseData.content,
                        content_id: responseData.content_id,
                        _message_type: 'received',
                        timestamp: responseData.timestamp
                    };

                    this.appendMessage(message);

                    if (this.debug) {
                        console.log('Server response:', responseData);
                    }
                } else if (response.status === 403) {
                    console.error('CSRF verification failed (403 Forbidden)');

                    // Try with an alternative approach - if we're here, the current CSRF approach didn't work
                    if (!this.disableCsrf) {
                        if (this.debug) {
                            console.log('Trying alternative CSRF approach...');
                        }

                        // Try one more time with a different CSRF header approach
                        try {
                            // Attempt to get a fresh token from a different source
                            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                                         document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;

                            if (token) {
                                this.csrfToken = token;

                                const altHeaders = { ...headers };
                                // Try with different header formats
                                altHeaders['X-CSRFToken'] = token;
                                altHeaders['csrf-token'] = token;

                                if (this.debug) {
                                    console.log('Retrying with alternative token:', token);
                                    console.log('Alternative headers:', altHeaders);
                                }

                                const altResponse = await fetch(`${this.serverUrl}/chat/send/`, {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: altHeaders,
                                    mode: 'cors',
                                    body: JSON.stringify({
                                        message: formattedContent,
                                        user_email: this.userEmail,
                                        user_name: this.userName,
                                        user_token: this.userToken,
                                        language: this.language,
                                        browser_session: this.browserSession,
                                        source_app: this.sourceApp
                                    })
                                });

                                if (altResponse.ok) {
                                    const responseData = await altResponse.json();

                                    const message = {
                                        content: responseData.content,
                                        content_id: responseData.content_id,
                                        _message_type: 'received',
                                        timestamp: responseData.timestamp
                                    };
                                    this.appendMessage(message);
                                    return; // Success with alternative approach
                                }
                            }
                        } catch (altError) {
                            console.error('Alternative CSRF approach failed:', altError);
                        }
                    }

                    // If we get here, both approaches failed
                    // Show a CSRF error message to the user
                    const errorMessage = {
                        content: "Sorry, there was a security verification error (CSRF). Please refresh the page and try again.",
                        _message_type: 'received'
                    };
                    this.appendMessage(errorMessage);

                    // Try to re-fetch the CSRF token for next time
                    this.fetchCsrfToken();

                    throw new Error('CSRF verification failed');
                } else {
                    console.error('Server response not OK:', response.status);
                    let errorMessage;

                    try {
                        const errorText = await response.text();
                        console.error('Error details:', errorText);

                        // Try to parse as JSON if possible
                        try {
                            const errorJson = JSON.parse(errorText);
                            if (errorJson.error) {
                                errorMessage = {
                                    content: `Error: ${errorJson.error}`,
                                    _message_type: 'received'
                                };
                            }
                        } catch (jsonError) {
                            // Not JSON, use the text directly if it's short enough
                            if (errorText && errorText.length < 100) {
                                errorMessage = {
                                    content: `Server error: ${errorText}`,
                                    _message_type: 'received'
                                };
                            }
                        }
                    } catch (textError) {
                        console.error('Error getting response text:', textError);
                    }

                    // If we couldn't get a specific error message, use a generic one
                    if (!errorMessage) {
                        errorMessage = {
                            content: `Sorry, there was an error communicating with the server (${response.status}). Please try again later.`,
                            _message_type: 'received'
                        };
                    }

                    this.appendMessage(errorMessage);
                    throw new Error(`Failed to send message: ${response.status}`);
                }
            } catch (error) {
                // Make sure to remove the typing indicator if there's an error
                this.hideTypingIndicator(indicatorId);
                throw error;
            }
        } catch (error) {
            console.error('Error sending message:', error);
            throw error; // Re-throw to handle in the submit handler
        }
    }

    displayMessages(messages) {
        // Clear existing messages except the greeting
        const container = this.shadow.getElementById('chatMessages');
        const firstMessage = container.querySelector('.message');
        container.innerHTML = '';

        if (firstMessage) {
            container.appendChild(firstMessage);
        }

        // Add loaded messages
        messages.forEach(message => {
            // Convert message format to internal format if needed
            const formattedMessage = {
                content: message.content,
                content_id: message.content_id,
                _message_type: message.is_user ? 'sent' : 'received',
                timestamp: message.timestamp
            };

            const messageHtml = this.messageTemplate(formattedMessage);
            container.insertAdjacentHTML('beforeend', messageHtml);
        });

        container.scrollTop = container.scrollHeight;
    }

    appendMessage(message) {
        // If this is a server response that includes content_id, make sure it's accessible
        // in the messageTemplate function
        if (message.content_id) {
            // Already has content_id from server
        } else if (message.content && typeof message.content === 'object' && message.content.content_id) {
            // The message might be nested in a content property
            message.content_id = message.content.content_id;
        }

        const container = this.shadow.getElementById('chatMessages');
        container.insertAdjacentHTML('beforeend', this.messageTemplate(message));
        container.scrollTop = container.scrollHeight;
    }

    messageTemplate(message) {
        // Determine message type based on how it was generated
        const messageType = message._message_type || (message.is_user ? 'sent' : 'received');

        // Determine sender based on message type, ignoring message.sender
        let sender;
        if (messageType === 'sent') {
            // For sent messages, use userName if available, otherwise use "You"
            sender = this.userName || 'You';
        } else {
            // For received messages, always use defaultSender
            sender = this.defaultSender;
        }

        const content = message.content || message.search || '';
        const timestamp = message.timestamp || this.getCurrentTimestamp();

        // Use the content_id from the server if available, otherwise generate a client-side ID
        const messageId = message.content_id ? `msg-${message.content_id}` : 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // Add feedback icons only for received messages if feedback is enabled
        const feedbackIcons = (messageType === 'received' && this.enableFeedback) ? `
            <div class="message-feedback">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="feedback-icon" data-message-id="${messageId}" data-feedback="positive" title="Helpful" viewBox="0 0 16 16">
                    <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 0 0-.443.05 9.365 9.365 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.224 2.224 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.866.866 0 0 1-.121.416c-.165.288-.503.56-1.066.56z"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="feedback-icon" data-message-id="${messageId}" data-feedback="negative" title="Not helpful" viewBox="0 0 16 16">
                    <path d="M8.864 15.674c-.956.24-1.843-.484-1.908-1.42-.072-1.05-.23-2.015-.428-2.59-.125-.36-.479-1.012-1.04-1.638-.557-.624-1.282-1.179-2.131-1.41C2.685 8.432 2 7.85 2 7V3c0-.845.682-1.464 1.448-1.546 1.07-.113 1.564-.415 2.068-.723l.048-.029c.272-.166.578-.349.97-.484C6.931.08 7.395 0 8 0h3.5c.937 0 1.599.478 1.934 1.064.164.287.254.607.254.913 0 .152-.023.312-.077.464.201.262.38.577.488.9.11.33.172.762.004 1.15.069.13.12.268.159.403.077.27.113.567.113.856 0 .289-.036.586-.113.856-.035.12-.08.244-.138.363.394.571.418 1.2.234 1.733-.206.592-.682 1.1-1.2 1.272-.847.283-1.803.276-2.516.211a9.877 9.877 0 0 1-.443-.05 9.364 9.364 0 0 1-.062 4.51c-.138.508-.55.848-1.012.964l-.261.065zM11.5 1H8c-.51 0-.863.068-1.14.163-.281.097-.506.229-.776.393l-.04.025c-.555.338-1.198.73-2.49.866-.333.035-.554.29-.554.55V7c0 .255.226.543.62.65 1.095.3 1.977.997 2.614 1.709.635.71 1.064 1.475 1.238 1.977.243.7.407 1.768.482 2.85.025.362.36.595.667.518l.262-.065c.16-.04.258-.144.288-.255a8.34 8.34 0 0 0-.145-4.726.5.5 0 0 1 .595-.643h.003l.014.004.058.013a8.912 8.912 0 0 0 1.036.157c.663.06 1.457.054 2.11-.163.175-.059.45-.301.57-.651.107-.308.087-.67-.266-1.021L12.793 7l.353-.354c.043-.042.105-.14.154-.315.048-.167.075-.37.075-.581 0-.211-.027-.414-.075-.581-.05-.174-.111-.273-.154-.315l-.353-.354.353-.354c.047-.047.109-.176.005-.488a2.224 2.224 0 0 0-.505-.804l-.353-.354.353-.354c.006-.005.041-.05.041-.17a.866.866 0 0 0-.121-.415C12.4 1.272 12.063 1 11.5 1z"/>
                </svg>
            </div>
        ` : '';

        return `
            <div class="message message-${messageType}" id="${messageId}">
                <div class="message-content">${content}</div>
                <div class="message-info">
                    <small>${sender} - ${timestamp}</small>
                    ${feedbackIcons}
                </div>
            </div>
        `;
    }
}