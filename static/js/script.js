let today = new Date().toDateString();

let lastDate = localStorage.getItem('lastAccessedDate');

if (today !== lastDate) {
    console.log("The date changed!");

    localStorage.setItem('lastAccessedDate', today);

    const allTodoBoxes = Object.keys(localStorage).filter(key => key !== 'lastAccessedDate');

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

    const allTodoBoxes = Object.keys(localStorage).filter(key => key !== 'lastAccessedDate');

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
            makeRefreshingTodoBox(button);
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
    let newTaskId = "task_" + Date.now();

    todoBoxData.tasks[newTaskId] = { task: 'New task', active: true };

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // ⛰️ Create a todo-task div and add it
    const div = document.createElement('div');

    div.className = 'todo-task';

    div.innerHTML = `
        <input type='radio'>
        <textarea class='todo-task-text' id='${newTaskId}'>New task</textarea>`;

    parentTodoBox.appendChild(div);

    div.querySelector('.todo-task-text').focus();

    setListeners();
}

// Complete a task when the radio button is pressed
function completeTask(radio) {
    let parentTodoTask = radio.parentElement;
    let parentTodoBox = parentTodoTask.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    // ✨ Change the task's active status in localStorage
    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    let taskId = parentTodoTask.querySelector('.todo-task-text').id;
    todoBoxData.tasks[taskId].active = !todoBoxData.tasks[taskId].active;

    // ⛰️ Check the task checkbox
    radio.checked = !todoBoxData.tasks[taskId].active;

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));
}

// Edit the task when the textarea is clicked
function editTask(textarea) {
    const taskId = textarea.id;

    let parentTodoBox = textarea.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    todoBoxData.tasks[taskId] = { task: textarea.value, active: true };

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));
}

function addTodoBox() {
    let fillInText = document.querySelector('.blank-todo-fill:not(.todo-box .blank-todo-fill)');
    if (fillInText) {
        fillInText.remove();
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

    if (Object.keys(todoBoxData.tasks).length >= 1) {
        Object.entries(todoBoxData.tasks).forEach(([taskId, taskContent]) => {

            let taskText = taskContent.task;
            let taskActiveBool = taskContent.active;

            let htmlCompleted = '';
            if (!taskActiveBool) {
                htmlCompleted = 'checked';
            }

            const div = document.createElement('div');

            div.className = 'todo-task';

            div.innerHTML = `
            <input type='radio' ${htmlCompleted}>
            <textarea class='todo-task-text' id='${taskId}'>${taskText}</textarea>`;

            box.appendChild(div);
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