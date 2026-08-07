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

            if (data.error) {
                throw new Error(data.error);
            }
            else if (data.result) {
                outputText.textContent = `${data.result}`;
            }
            else {
                throw new Error("Error: couldn't generate a response.");
            }

            document.querySelector('#sent-messages').appendChild(outputElement);

        } catch (error) {
            console.log("Error message");
            outputText.textContent = `${error}. Please try again later or let the creator know!!`;

            let alertElement = document.createElement('div');
            alertElement.className = 'fade show alert alert-danger d-flex align-items-center alert-dismissible';
            alertElement.role = 'alert';
            alertElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="margin-right: 10px;" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
          </svg> ${error}.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

            document.querySelector('#chat-title').prepend(alertElement);
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
    });

    // Activate link
    document.querySelector('#sidebar-chat-link').className = 'nav-link active';
});
