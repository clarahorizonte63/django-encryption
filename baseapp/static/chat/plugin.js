/**
 * GenAiChatPlugin - A flexible chat widget for AI-powered conversations
 * Version 1.0.0
 */
class GenAiChatPlugin {
    constructor(options = {}) {
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
        this.disableCsrf = true; // options.disableCsrf ||  false Option to disable CSRF (for APIs that don't require it)

        // Add user parameters
        this.userEmail = options.userEmail || '';
        this.userName = options.userName || '';
        this.userToken = options.userToken || '';
        this.language = options.language || 'en';
        this.sourceApp = options.sourceApp || ''; // Source app parameter
        this.browserSession = options.browserSession ||  this.generateSessionId();
        this.formatMessage = options.formatMessage !== undefined ? options.formatMessage : true; // Flag to format message with user details


        // Debug mode for troubleshooting
        this.debug = options.debug || false;

        this.init();
    }

    // Generate a unique session ID if none is provided
    generateSessionId() {
        const timestamp = new Date().getTime();
        const randomNum = Math.floor(Math.random() * 10000);
        return `session_${timestamp}_${randomNum}`;
    }

    async init() {
        // Set up a timeout to animate the chat button if not clicked
        this.setupButtonAttentionTimeout();

        // Load Bootstrap CSS
        if (!document.querySelector('link[href*="bootstrap"]')) {
            const bootstrapCSS = document.createElement('link');
            bootstrapCSS.rel = 'stylesheet';
            bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css';
            document.head.appendChild(bootstrapCSS);
        }

        // Load Bootstrap JS
        if (!document.querySelector('script[src*="bootstrap"]')) {
            const bootstrapJS = document.createElement('script');
            bootstrapJS.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js';
            document.body.appendChild(bootstrapJS);
        }

        // Load Bootstrap Icons CSS
        if (!document.querySelector('link[href*="bootstrap-icons"]')) {
            const bootstrapIconsCSS = document.createElement('link');
            bootstrapIconsCSS.rel = 'stylesheet';
            bootstrapIconsCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css';
            document.head.appendChild(bootstrapIconsCSS);
        }

        // Create and inject CSS
        const style = document.createElement('style');
        style.textContent = `
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

            .chat-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                z-index: 1000;
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
            .btn-sending {
                position: relative;
                pointer-events: none;
                opacity: 0.65;
            }
            .btn-sending .spinner-border {
                width: 1rem;
                height: 1rem;
                margin-right: 0.5rem;
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
        document.head.appendChild(style);

        // Create chat button
        const button = document.createElement('button');
        button.id = 'chatButton';
        button.className = 'btn btn-primary rounded-circle chat-button';
        button.setAttribute('data-bs-toggle', 'modal');
        button.setAttribute('data-bs-target', '#chatModal');
        button.innerHTML = '<i class="bi bi-chat-dots"></i>';
        document.body.appendChild(button);

        // Create modal container
        this.containerElement = document.createElement('div');
        this.containerElement.innerHTML = `
            <div class="modal fade" id="chatModal" tabindex="-1" aria-labelledby="chatModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-right">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="chatModalLabel">${this.chatName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="chat-messages" id="chatMessages">
                                <div class="message message-received">
                                    <div class="message-content"><b>Olá!</b> ${this.defaultGreeting}</div>
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
        document.body.appendChild(this.containerElement);

        // Add form submit handler
        document.getElementById('chatForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const input = form.querySelector('input');
            const sendButton = form.querySelector('#sendButton');
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
        document.addEventListener('click', async (e) => {
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
                        const negativeIcon = document.querySelector(`.feedback-icon[data-message-id="${messageId}"][data-feedback="negative"]`);
                        if (negativeIcon) {
                            negativeIcon.style.opacity = '0.3';
                            negativeIcon.style.cursor = 'default';
                            negativeIcon.classList.remove('feedback-icon');
                            negativeIcon.classList.add('feedback-icon-disabled');
                        }
                    } else {
                        e.target.style.color = '#dc3545'; // Red
                        // Find the positive feedback icon and disable it
                        const positiveIcon = document.querySelector(`.feedback-icon[data-message-id="${messageId}"][data-feedback="positive"]`);
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

        // Add event listener to stop animation when button is clicked
        document.getElementById('chatButton').addEventListener('click', () => {
            this.removeButtonAttention();
            // Clear timeout if it hasn't fired yet
            if (this.buttonAttentionTimeout) {
                clearTimeout(this.buttonAttentionTimeout);
                this.buttonAttentionTimeout = null;
            }
        });

        // Get initial CSRF token and load messages
        await this.fetchCsrfToken();
        await this.loadMessages();
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
        const button = document.getElementById('chatButton');
        if (button) {
            // Randomly choose one of the three animation styles
            const animations = ['shake', 'pulse', 'blink'];
            const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
            button.classList.add(`chat-button-attention-${randomAnimation}`);
        }
    }

    removeButtonAttention() {
        const button = document.getElementById('chatButton');
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
        const form = document.getElementById('chatForm');
        const input = form.querySelector('input');
        const sendButton = form.querySelector('#sendButton');

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
        const container = document.getElementById('chatMessages');
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
        const indicator = document.getElementById(indicatorId);
        if (indicator) {
            indicator.remove();
        }
    }

    async sendMessage(content) {
        try {
            // First ensure we have a fresh CSRF token
            await this.fetchCsrfToken();
            console.log('message sent')
            console.log(this.browserSession);

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
        const container = document.getElementById('chatMessages');
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

        const container = document.getElementById('chatMessages');
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
                <i class="bi bi-hand-thumbs-up feedback-icon" data-message-id="${messageId}" data-feedback="positive" title="Helpful"></i>
                <i class="bi bi-hand-thumbs-down feedback-icon" data-message-id="${messageId}" data-feedback="negative" title="Not helpful"></i>
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