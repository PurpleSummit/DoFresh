let today = new Date().toDateString();

let lastDate = localStorage.getItem('lastAccessedDate');

if (today !== lastDate) {
    console.log("The date changed!");

    localStorage.setItem('lastAccessedDate', today);

    const allTodoBoxes = Object.keys(localStorage).filter(key => Number.isInteger(+key));

    allTodoBoxes.forEach(todoBox => {
        let todoBoxData = JSON.parse(localStorage.getItem(todoBox));

        if (todoBoxData && todoBoxData.refreshing && todoBoxData.tasks) {
            const allCompletedTasks = Object.entries(todoBoxData.tasks).filter(([taskId, taskContent]) => !taskContent.active);

            allCompletedTasks.forEach(([taskId, taskContent]) => {
                todoBoxData.tasks[taskId].active = true;
            });

            localStorage.setItem(todoBox, JSON.stringify(todoBoxData));
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log(localStorage);

    const allTodoBoxes = Object.keys(localStorage).filter(key => Number.isInteger(+key));

    allTodoBoxes.forEach(boxId => {
        addHTMLTodoBox(boxId);
    });

    if (allTodoBoxes.length < 1) {
        fillIfBlank(document.body);
    }

    setListeners();
});

function setListeners() {
    // To-do task buttons
    let allAddTaskButtons = document.querySelectorAll('.add-task-btn');

    allAddTaskButtons.forEach(button => {
        button.onclick = () => {
            addTask(button);
        };
    });

    let allTodoTasks = document.querySelectorAll('.todo-task-text');

    allTodoTasks.forEach(textarea => {
        // TODO NEXT MORNING: FIND HOW TO DO FOCUSOUT FOR NON-OVERLAPPING
        textarea.addEventListener('focusout', () => {
            editTask(textarea);
        });
    });

    let allTodoCheckboxes = document.querySelectorAll('input[type="radio"]');

    allTodoCheckboxes.forEach(radio => {
        radio.onclick = () => {
            completeTask(radio);
        };
    });

    let allRemoveTaskButtons = document.querySelectorAll('.remove-task-btn');

    allRemoveTaskButtons.forEach(button => {
        button.onclick = () => {
            removeTask(button);
        };
    });

    // To-do box buttons
    let addTodoBoxButton = document.querySelector('.add-todo-box-btn');

    addTodoBoxButton.addEventListener('click', addTodoBox);

    let allRenameTodoBoxButtons = document.querySelectorAll('.rename-todo-box-btn');

    allRenameTodoBoxButtons.forEach(button => {
        button.onclick = () => {
            renameTodoBox(button);
        };
    });

    let allRemoveTodoBoxButton = document.querySelectorAll('.remove-todo-box-btn');

    allRemoveTodoBoxButton.forEach(button => {
        button.onclick = () => {
            removeTodoBox(button);
        };
    });

    let allRefreshTodoBoxButton = document.querySelectorAll('.refreshing-todo-box-btn');
    allRefreshTodoBoxButton.forEach(button => {
        button.onclick = () => {
            removeTask(button);
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

    const parentTodoBox = button.parentElement.parentElement.parentElement;

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
    let newTaskId = "task_" + Date.now();

    todoBoxData.tasks[newTaskId] = { task: 'New task', active: true };

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // ⛰️ Create a todo-task div and add it
    const div = document.createElement('div');
    div.id = newTaskId;
    div.className = 'todo-task';

    div.innerHTML = `
        <input type='radio'>
        <textarea class='todo-task-text''>New task</textarea>
        <button class='remove-task-btn'><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
            </svg>
        </button>`;

    parentTodoBox.querySelector('.todo-box-tasks').appendChild(div);

    div.querySelector('.todo-task-text').focus();

    setListeners();
}

// Complete a task when the radio button is pressed
function completeTask(radio) {
    let parentTodoTask = radio.parentElement;
    let taskId = parentTodoTask.id;

    let parentTodoBox = parentTodoTask.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    // ✨ Change the task's active status in localStorage
    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);
    
    todoBoxData.tasks[taskId].active = !todoBoxData.tasks[taskId].active;

    // ⛰️ Check the task checkbox
    radio.checked = !todoBoxData.tasks[taskId].active;

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));
}

// Edit the task when the textarea is clicked
function editTask(textarea) {
    let parentTodoTask = textarea.parentElement;
    let taskId = parentTodoTask.id;

    let parentTodoBox = parentTodoTask.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    // ✨ Change the task's content in localStorage
    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    todoBoxData.tasks[taskId].task = textarea.value;

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));
}

// Remove a task when the radio button is pressed
function removeTask(button) {
    let parentTodoTask = button.parentElement;
    let taskId = parentTodoTask.id;

    let parentTodoBox = parentTodoTask.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    // ✨ Remove the task from the tasks object of the todoBox in localStorage
    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    delete todoBoxData.tasks[taskId];

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // ⛰️ Delete the task div from the todo box
    parentTodoTask.remove();

    // If there are no tasks left, fill in the blank
    if (Object.keys(todoBoxData.tasks).length < 1) {
        fillIfBlank(parentTodoBox);
    }
}

function addTodoBox() {
    let fillInText = document.querySelector('.blank-todo-fill:not(.todo-box .blank-todo-fill)');
    if (fillInText) {
        fillInText.remove();
    }

    // ✨ Initializing the data for the to-do box
    // Creating a new id number for the box
    let taskBoxList = Object.keys(localStorage).filter(key => Number.isInteger(+key));
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
    let todoBoxData = localStorage.getItem(boxId);

    todoBoxData = JSON.parse(todoBoxData);

    let box = document.createElement('div');
    box.className = 'todo-box';
    box.id = `todo-box${boxId}`;

    let boxTitle;

    if (todoBoxData.title == "To-Do List") {
        boxTitle = `${todoBoxData.title} ${boxId}`;
    }
    else {
        boxTitle = todoBoxData.title;
    }

    let refreshingCheck = '';
    let refreshingTag = '';
    if (todoBoxData.refreshing) {
        refreshingCheck = '☑';
        refreshingTag = 'Refreshing';

    }

    box.innerHTML = `
    <div class='todo-box-heading'>
        <h2 class='todo-title'>${boxTitle}</h2>
        <div class="btn-group">
            <span class="badge text-bg-primary refreshing-tag">${refreshingTag}</span>
            <button class='btn-light add-task-btn'>+</button>
            <button type="button" class="btn btn-light edit-todo-box-btn" data-bs-toggle="dropdown" aria-expanded="false" data-toggle="dropdown">
                <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor'
                class='bi bi-three-dots' viewBox='0 0 16 16'>
                    <path
                    d='M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3' />
                </svg>
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item refreshing-todo-box-btn" href="#">Refreshing list ${refreshingCheck}</a></li>
                <li><a class="dropdown-item rename-todo-box-btn" href="#">Rename</a></li>
                <li><a class="dropdown-item remove-todo-box-btn" href="#">Remove list</a></li>
            </ul>
        </div>
    </div>`;

    let todoBoxDiv = document.querySelector('.todo-box-div');
    todoBoxDiv.appendChild(box);

    const todoBoxTasks = document.createElement('div');
    todoBoxTasks.className = 'todo-box-tasks';
    box.appendChild(todoBoxTasks);

    if (Object.keys(todoBoxData.tasks).length >= 1) {
        Object.entries(todoBoxData.tasks).forEach(([taskId, taskContent]) => {

            let taskText = taskContent.task;
            let taskActiveBool = taskContent.active;

            let htmlCompleted = '';
            if (!taskActiveBool) {
                htmlCompleted = 'checked';
            }

            const div = document.createElement('div');
            div.id = `${taskId}`;
            div.className = 'todo-task';

            div.innerHTML = `
            <input type='radio' ${htmlCompleted}>
            <textarea class='todo-task-text'>${taskText}</textarea>
            <button class='remove-task-btn'>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                </svg>
            </button>`;

            todoBoxTasks.appendChild(div);
        });
    }
    else {
        fillIfBlank(box);
    }

    // Add the collapsing div for the completed tasks
    let collapseDiv = document.createElement('div');
    collapseDiv.className = 'todo-box-completed-tasks';
    collapseDiv.innerHTML = `<p class="d-inline-flex gap-1">
        <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
            Completed v
        </button>
    </p>
    <div class="collapse" id="collapseExample">
        Completed tasks go here!
    </div>`;
    box.appendChild(collapseDiv);

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

function renameTodoBox(button) {
    let parentTodoBox = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');
    let todoBoxData = JSON.parse(localStorage[todoBoxId]);

    let todoTitleHeader = parentTodoBox.querySelector('.todo-title');

    let renamedTitle = prompt("Rename list", todoTitleHeader.innerText);

    if (renamedTitle == "" || renamedTitle == null) {
        return;
    }
    else {
        todoBoxData.title = renamedTitle;
        localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

        todoTitleHeader.innerText = todoBoxData.title;
    }
}

function makeRefreshingTodoBox(button) {
    let parentTodoBox = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');
    let todoBoxData = JSON.parse(localStorage[todoBoxId]);

    // ✨ Change the refreshing bool and update localStorage
    todoBoxData.refreshing = !todoBoxData.refreshing;

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    console.log(todoBoxData);

    // ⛰️ Update the todo box HTML to be a refreshing / standard to-do list
    let refreshingCheck = '';
    let refreshingTag = '';
    if (todoBoxData.refreshing) {
        refreshingCheck = '☑';
        refreshingTag = 'Refreshing';
    }

    parentTodoBox.querySelector('.refreshing-todo-box-btn').innerHTML = `Refreshing list ${refreshingCheck}`;
    parentTodoBox.querySelector('.refreshing-tag').innerHTML = refreshingTag;
}
