document.addEventListener('DOMContentLoaded', () => {
    console.log(localStorage);

    let allTodoBoxes = Object.keys(localStorage);

    allTodoBoxes.forEach(boxId => {
        addHTMLTodoBox(boxId);
    });

    if (allTodoBoxes.length < 1) {
        fillIfBlank(document.body);
    }

    setListeners();

});

function setListeners() {
    let allAddTaskButtons = document.querySelectorAll('.add-task-btn');

    allAddTaskButtons.forEach(button => {
        button.onclick = () => {
            console.log('Before task was added:', localStorage);
            addTask(button);
            console.log('After task was added:', localStorage);
        };
    });

    let allTodoTasks = document.querySelectorAll('.todo-task-text');

    allTodoTasks.forEach(textarea => {
        textarea.onfocusout = () => {
            editTask(textarea);
        };
    });

    let allTodoCheckboxes = document.querySelectorAll('input[type="radio"]');

    allTodoCheckboxes.forEach(radio => {
        radio.onclick = () => {
            console.log('Before radio was clicked:', localStorage);
            destroyTask(radio);
            console.log('After radio was clicked:', localStorage);
        };
    });

    let addTodoBoxButton = document.querySelector('.add-todo-box-btn');

    addTodoBoxButton.addEventListener('click', addTodoBox);

    let allEditTodoBoxButton = document.querySelectorAll('.edit-todo-box-btn');

    allEditTodoBoxButton.forEach(button => {
        button.onclick = () => {

        };
    });

    let allRemoveTodoBoxButton = document.querySelectorAll('.remove-todo-box-btn');

    allRemoveTodoBoxButton.forEach(button => {
        button.onclick = () => {
            removeTodoBox(button);
        };
    });
}

function fillIfBlank(todoBox) {
    const span = document.createElement('span');
    span.className = 'blank-todo-fill';
    span.innerText = '📝 A blank canvas here! 🤩';

    todoBox.appendChild(span);
}

// Add a task when the + button on the to-do box is clicked
function addTask(button) {

    const parentTodoBox = button.parentElement.parentElement;

    // Remove the fill-in paragraph if needed
    let fillInText = parentTodoBox.querySelector('.blank-todo-fill');
    if (fillInText) {
        parentTodoBox.removeChild(fillInText);
    }

    // ✨ Add the new task to localStorage
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');
    let todoBoxData = localStorage.getItem(todoBoxId);

    if (todoBoxData) {
        todoBoxData = JSON.parse(todoBoxData);
    }
    else {
        let boxTitle = parentTodoBox.querySelector('.todo-title')?.innerText || 'To-Do List';
        todoBoxData = { title: boxTitle, tasks: {}, refreshing: false };
    }

    // Creating a new id for the new task
    let taskList = Object.keys(todoBoxData.tasks);

    let newTaskId;

    if (taskList.length < 1) {
        newTaskId = 0;
    }
    else {
        newTaskId = Math.max(...taskList) + 1;
    }

    console.log(newTaskId);

    todoBoxData.tasks[newTaskId] = 'New task';

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // ⛰️ Create a todo-task div and add it
    const div = document.createElement('div');

    div.className = 'todo-task';

    div.innerHTML = `
        <input type='radio'>
        <textarea class='todo-task-text' id='todo-task${newTaskId}'>New task</textarea>`;

    parentTodoBox.appendChild(div);

    div.querySelector('.todo-task-text').focus();

    setListeners();

    console.log(localStorage);
}

// Remove a task when the radio button is pressed
function destroyTask(radio) {
    let parentTodoTask = radio.parentElement;
    let parentTodoBox = parentTodoTask.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    // ✨ Remove the task from the tasks object of the todoBox in localStorage
    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    let taskId = parentTodoTask.querySelector('.todo-task-text').id.replace('todo-task', '');

    delete todoBoxData.tasks[taskId];

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // ⛰️ Delete the task div from the todo box
    parentTodoBox.removeChild(parentTodoTask);

    // If there are no tasks left, fill in the blank
    if (Object.keys(todoBoxData.tasks).length < 1) {
        fillIfBlank(parentTodoBox);
    }
}

// Edit the task when the textarea is clicked
function editTask(textarea) {
    const taskId = textarea.id.replace('todo-task', '');

    let parentTodoBox = textarea.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    todoBoxData.tasks[taskId] = textarea.value;

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));
}

function addTodoBox() {
    let fillInText = document.body.querySelector('.blank-todo-fill');
    if (fillInText) {
        document.body.removeChild(fillInText);
    }

    // ✨ Initializing the data for the to-do box
    // Creating a new id number for the box
    let taskBoxList = Object.keys(localStorage);
    let newBoxId;

    if (taskBoxList.length < 1) {
        newBoxId = 1;
    }
    else {
        newBoxId = Math.max(...taskBoxList) + 1;
    }

    let todoBoxData = { title: 'To-Do List', tasks: {}, refreshing: false };
    localStorage.setItem(newBoxId, JSON.stringify(todoBoxData));

    addHTMLTodoBox(newBoxId);
}

function addHTMLTodoBox(boxId) {
    let todoBoxData = localStorage.getItem(boxId)
    todoBoxData = JSON.parse(todoBoxData);

    let box = document.createElement('div');
    box.className = 'todo-box';
    box.id = `todo-box${boxId}`;

    box.innerHTML = `
    <div class='todo-box-heading'>
        <h2 class='todo-title'>${todoBoxData.title} ${boxId}</h2>
        <button class='btn-light add-task-btn'>+</button>
        <div class="btn-group">
            <button type="button" class="btn btn-light edit-todo-box-btn" data-bs-toggle="dropdown" aria-expanded="false" data-toggle="dropdown">
                <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor'
                class='bi bi-three-dots' viewBox='0 0 16 16'>
                    <path
                    d='M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3' />
                </svg>
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#">Rename</a></li>
                <li><a class="dropdown-item remove-todo-box-btn" href="#">Remove list</a></li>
            </ul>
        <div>
    </div>`;

    let todoBoxDiv = document.querySelector('.todo-box-div');

    todoBoxDiv.appendChild(box);

    if (Object.keys(todoBoxData.tasks).length >= 1) {
        Object.entries(todoBoxData.tasks).forEach(([taskId, taskText]) => {
            const div = document.createElement('div');

            div.className = 'todo-task';

            div.innerHTML = `
            <input type='radio'>
            <textarea class='todo-task-text' id='todo-task${taskId}'>${taskText}</textarea>`;

            box.appendChild(div);

            console.log(`Adding ${taskText}`);
        });
    }
    else {
        fillIfBlank(box);
    }

    setListeners();
}

function removeTodoBox(button) {
    let parentTodoBox = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    localStorage.removeItem(todoBoxId);

    document.querySelector('.todo-box-div').removeChild(parentTodoBox);

    if (Object.keys(localStorage).length < 1) {
        fillIfBlank(document.body);
    }
}