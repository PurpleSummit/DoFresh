document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('send-btn').addEventListener('click', async () => {
        const sentMessageContainer = document.querySelector('#sent-messages');

        const userInput = document.querySelector('#user-input');
        const userPrompt = userInput.value;

        const userMsgElement = document.createElement('div');
        userMsgElement.className = 'message-container user-message';
        userMsgElement.innerHTML = `<pre class='message-text'>${userPrompt}</pre>`;
        sentMessageContainer.appendChild(userMsgElement);

        // Create HTML for AI response
        const outputElement = document.createElement('div');
        outputElement.className = "message-container";

        sentMessageContainer.appendChild(outputElement);

        userInput.value = "";

        const outputText = document.createElement('prev');
        outputText.className = 'message-text';
        outputText.textContent = 'Thinking...';

        outputElement.appendChild(outputText);

        // fetch for Flask backend API
        try {
            console.log(JSON.stringify({ userMessage: userPrompt }));
            const response = await fetch('http://127.0.0.1:5000/api/respond-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userMessage: userPrompt })
            });

            const data = await response.json();

            outputText.textContent = `${data.result}` || `${data.details}` || '<p>No response returned.';
            document.querySelector('#sent-messages').appendChild(outputElement);

        } catch (error) {
            console.log(error);
            outputElement.textContent = 'Error contacting the server.';
        }
    });

    document.getElementById('refresh-chat-btn').addEventListener('click', async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/delete-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            console.log(response);

            let alertElement = document.createElement('div');
            alertElement.className = 'fade show alert alert-success d-flex align-items-center alert-dismissible';
            alertElement.role = 'alert';
            alertElement.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16" style="margin-right: 10px;">
                <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
            </svg>
            Chat was successfully refreshed.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
            document.querySelector('#chat-title').after(alertElement);

            document.querySelector('#sent-messages').innerHTML = "";

        } catch (error) {
            let alertElement = document.createElement('div');
            alertElement.className = 'fade show alert alert-danger d-flex align-items-center alert-dismissible';
            alertElement.role = 'alert';
            alertElement.innerHTML = `Error refreshing the chat.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

            document.querySelector('#chat-title').prepend(alertElement);
        }

        let refreshChatModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('refreshChatModal'));
        refreshChatModal.hide();
    })
});
