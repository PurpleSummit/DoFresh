let today = new Date().toDateString();

let lastDate = localStorage.getItem('lastAccessedDate');

if (today !== lastDate) {
    console.log("The date changed!");

    localStorage.setItem('lastAccessedDate', today);

    const allTodoBoxes = Object.keys(localStorage).filter(key => Number.isInteger(+key));

    allTodoBoxes.forEach(todoBox => {
        let todoBoxData = JSON.parse(localStorage.getItem(todoBox));

        if (todoBoxData && todoBoxData.refreshing && todoBoxData.tasks) {
            todoBoxData.tasks.active = todoBoxData.tasks.active.concat(todoBoxData.tasks.completed);

            todoBoxData.tasks.completed = [];

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

    /* let allRefreshTodoBoxButton = document.querySelectorAll('.refreshing-todo-box-btn');
    allRefreshTodoBoxButton.forEach(button => {
        button.onclick = () => {
            makeRefreshingTodoBox(button);
        };
    }); */
}

function fillIfBlank(todoBox) {
    const span = document.createElement('span');
    span.className = 'blank-todo-fill';
    span.innerText = '📝 A blank canvas here! 🤩\n';

    todoBox.appendChild(span);
}

// Add a task when the + button on the to-do box is clicked
function addTask(button) {

    const todoBox = button.parentElement.parentElement.parentElement;
    const parentTasksBox = todoBox.querySelector('.todo-box-tasks');

    // Remove the fill-in paragraph if needed
    let fillInText = parentTasksBox.querySelector('.blank-todo-fill');
    if (fillInText) {
        fillInText.remove();
    }

    // ✨ Add the new task to localStorage
    let todoBoxId = todoBox.id.replace('todo-box', '');
    let todoBoxData = localStorage.getItem(todoBoxId);

    if (todoBoxData) {
        todoBoxData = JSON.parse(todoBoxData);
    }
    else {
        let boxTitle = parentTasksBox.querySelector('.todo-title')?.innerText || 'To-Do List';
        todoBoxData = { title: boxTitle, tasks: {active: [], completed: []}, refreshing: false };
    }

    // Creating a new id for the new task
    let newTaskId = "task_" + Date.now();

    todoBoxData.tasks.active.push({[newTaskId]: { task: 'New task!' }});

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // ⛰️ Create a todo-task div and add it
    addHTMLTodoTask(todoBoxId, newTaskId, 'New task!', true);

    document.querySelector(`#${newTaskId}`).querySelector('.todo-task-text').focus();

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

    let taskContent, active;
    let taskIndex = todoBoxData.tasks.active.indexOf(todoBoxData.tasks.active.find(task => taskId in task));
    if (taskIndex > -1) {
        taskContent = parentTodoTask.querySelector('.todo-task-text').innerHTML;
        active = false;

        todoBoxData.tasks.completed.push(todoBoxData.tasks.active[taskIndex]);
        todoBoxData.tasks.active.splice(taskIndex, 1);
    }
    else {
        taskContent = parentTodoTask.querySelector('.todo-completed-task-text').innerHTML;
        active = true;

        let fillInText = parentTodoBox.querySelector('.todo-box-tasks').querySelector('.blank-todo-fill');
        if (fillInText) {
            fillInText.remove();
        }
        
        taskIndex = todoBoxData.tasks.completed.indexOf(todoBoxData.tasks.completed.find(task => taskId in task));
        todoBoxData.tasks.active.push(todoBoxData.tasks.completed[taskIndex]);
        todoBoxData.tasks.completed.splice(taskIndex, 1);
        
        addHTMLTodoTask(todoBoxId, taskId, taskContent, active);   
    }

    // If no active tasks
    if (todoBoxData.tasks.active.length < 1) {
        fillIfBlank(parentTodoBox.querySelector('.todo-box-tasks'));
    }
    
    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    parentTodoTask.remove();
    
    // Updates all the tasks in completed-tasks div & removes elements if no tasks left
    updateHTMLCollapseDiv(todoBoxId);

    setListeners();
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

    let targetTaskObject = todoBoxData.tasks.active.find(task => taskId in task);

    if (targetTaskObject) {
        targetTaskObject[taskId].task = textarea.value;
    }

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));
}

// Remove a task when the trash button is pressed
function removeTask(button) {
    let parentTodoTask = button.parentElement;
    let taskId = parentTodoTask.id;

    let parentTodoBox = parentTodoTask.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    // ✨ Remove the task from the tasks object of the todoBox in localStorage
    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    const taskIndex = todoBoxData.tasks.active.indexOf(todoBoxData.tasks.active.find(task => taskId in task));
    if (taskIndex > -1) {
        todoBoxData.tasks.active.splice(taskIndex, 1);
    }
    else {
        const taskIndex = todoBoxData.tasks.completed.indexOf(todoBoxData.tasks.completed.find(task => taskId in task));
        if (taskIndex > -1) {
            todoBoxData.tasks.completed.splice(taskIndex, 1);
            updateHTMLCollapseDiv(todoBoxId);
        }
    }

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // ⛰️ Delete the task div from the todo box
    parentTodoTask.remove();

    // If there are no tasks left, fill in the blank
    if (Object.keys(todoBoxData.tasks.active).length < 1) {
        fillIfBlank(parentTodoBox.querySelector('.todo-box-tasks'));
    }
}

function addTodoBox() {
    let fillInText = document.querySelector('.blank-todo-fill:not(.todo-box .blank-todo-fill)');
    if (fillInText) {
        fillInText.remove();
    }

    const refreshingBoxButton = document.querySelector('#add-refreshing-box-button');
    const standardBoxButton = document.querySelector('#add-standard-box-button');

    let refreshingBool;
    let addBoxModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('makeTodoBoxModal'));


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
    
    refreshingBoxButton.onclick = () => {
        refreshingBool = true;
        addBoxModal.hide();
    
        let todoBoxData = { title: 'To-Do List', tasks: {active: [], completed: []}, refreshing: false };
        localStorage.setItem(newBoxId, JSON.stringify(todoBoxData));

        addHTMLTodoBox(newBoxId);
        makeRefreshingTodoBox(newBoxId);
        };

    standardBoxButton.onclick = () => {
        refreshingBool = false;
        addBoxModal.hide();

        let todoBoxData = { title: 'Refreshing To-Do List', tasks: {active: [], completed: []}, refreshing: false };
        localStorage.setItem(newBoxId, JSON.stringify(todoBoxData));

        addHTMLTodoBox(newBoxId);
    };
}

function addHTMLTodoTask(todoBoxId, taskId, taskText, active) {
    const div = document.createElement('div');
    div.id = `${taskId}`;
    div.className = 'todo-task';

    let checked, disabled, completed = '';
    if (!active) {
        checked = " checked";
        disabled = " disabled";
        completed = "-completed";
    }

    div.innerHTML = `
    <input type='radio'${checked}>
    <textarea class='todo${completed}-task-text'${disabled}>${taskText}</textarea>
    <button class='remove-task-btn'>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
        </svg>
    </button>`;

    let taskDiv = document.querySelector(`#todo-box${todoBoxId}`).querySelector(`.todo-box${completed}-tasks`);
    if (!active && taskDiv === null) {
        // Adds a collapse div and all the tasks
        addHTMLCollapseDiv(todoBoxId);
        taskDiv = document.querySelector(`#todo-box${todoBoxId}`).querySelector(`.todo-box${completed}-tasks`);
    }
    else {
        taskDiv.appendChild(div);
    }

}

function addHTMLCollapseDiv(todoBoxId) {
    const box = document.querySelector(`#todo-box${todoBoxId}`);
    
    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    let collapseToggle = document.createElement('div');
    collapseToggle.className = 'collapse-btn-div d-inline-flex gap-1';
    collapseToggle.innerHTML = `<button class="btn btn-light collapse-btn" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample${todoBoxId}" aria-expanded="false" aria-controls="collapseExample${todoBoxId}">
        Completed (${todoBoxData.tasks.completed.length})
    </button>`;
    box.appendChild(collapseToggle);

    const collapseDiv = document.createElement('div');
    collapseDiv.className = 'collapse todo-box-completed-tasks';
    collapseDiv.id = `collapseExample${todoBoxId}`;
    box.appendChild(collapseDiv);
}

function addHTMLTodoBox(boxId) {
    let todoBoxData = localStorage.getItem(boxId);
    todoBoxData = JSON.parse(todoBoxData);

    let box = document.createElement('div');
    box.className = 'todo-box';
    box.id = `todo-box${boxId}`;

    let boxTitle = todoBoxData.title;

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
                <!-- <li><a class="dropdown-item refreshing-todo-box-btn" href="#">Refreshing list ${refreshingCheck}</a></li> -->
                <li><a class="dropdown-item rename-todo-box-btn" href="#" data-bs-toggle="modal" data-bs-target="#exampleModal">Rename</a></li>
                <li><a class="dropdown-item remove-todo-box-btn" href="#">Remove list</a></li>
            </ul>
        </div>
    </div>
    <div class='todo-box-tasks'>
    </div>`;

    let todoBoxDiv = document.querySelector('.todo-box-div');
    todoBoxDiv.appendChild(box);

    if (todoBoxData.tasks.active.length >= 1) {
        (todoBoxData.tasks.active).forEach((task) => {
            let taskId = Object.keys(task)[0];
            let taskText = task[taskId].task;

            addHTMLTodoTask(boxId, taskId, taskText, true);
        });
    }
    else {
        fillIfBlank(box.querySelector('.todo-box-tasks'));
    }
 
    box.appendChild(document.createElement('br'));

    if (todoBoxData.tasks.completed.length >= 1) {
        // Add the collapsing div for the completed tasks
        addHTMLCollapseDiv(boxId);
        updateHTMLCollapseDiv(boxId);
    }

    setListeners();
}

function updateHTMLCollapseDiv(todoBoxId) {
    const todoBox = document.querySelector(`#todo-box${todoBoxId}`);

    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    let collapseToggle = todoBox.querySelector('.collapse-btn-div');
    if (collapseToggle === null) {
        addHTMLCollapseDiv(todoBoxId);
        collapseToggle = todoBox.querySelector('.collapse-btn-div');
    }

    collapseToggle.innerHTML = `<button class="btn btn-light collapse-btn" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample${todoBoxId}" aria-expanded="false" aria-controls="collapseExample${todoBoxId}">
        Completed (${todoBoxData.tasks.completed.length})
    </button>`;

    // Wipe the original completed-tasks div and update
    todoBox.querySelector('.todo-box-completed-tasks').innerHTML = '';

    (todoBoxData.tasks.completed).forEach((task) => {

        let taskId = Object.keys(task)[0];
        let taskText = task[taskId].task;

        addHTMLTodoTask(todoBoxId, taskId, taskText, false);
    });

    // If no completed tasks
    if (todoBoxData.tasks.completed.length < 1) {
        let completedDiv = todoBox.querySelector('.todo-box-completed-tasks');
        completedDiv.remove();
        let completedButton = todoBox.querySelector('.collapse-btn-div');
        todoBox.removeChild(completedButton);
    }
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
    const parentTodoBox = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');
    let todoBoxData = JSON.parse(localStorage[todoBoxId]);

    const todoTitleHeader = parentTodoBox.querySelector('.todo-title');

    const renameModalInput = document.querySelector('#modal-rename-input');
    const renameModalButton = document.querySelector('#modal-rename-button');

    renameModalInput.value = todoTitleHeader.innerText;

    renameModalButton.onclick = () => {
        const renamedTitle = renameModalInput.value;
        
        if (renamedTitle == "" || renamedTitle == null) {
            return;
        }
        else {
            todoBoxData.title = renamedTitle;
            localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

            todoTitleHeader.innerText = todoBoxData.title;
        }

        let renameModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('exampleModal'));
        renameModal.hide();
    };    
}

function makeRefreshingTodoBox(todoBoxId) {
    let todoBoxData = JSON.parse(localStorage[todoBoxId]);
    let parentTodoBox = document.querySelector(`#todo-box${todoBoxId}`);

    // ✨ Change the refreshing bool and update localStorage
    todoBoxData.refreshing = true;

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // ⛰️ Update the todo box HTML to be a refreshing / standard to-do list
    let refreshingTag = '';
    if (todoBoxData.refreshing) {
        refreshingTag = 'Refreshing';
    }

    parentTodoBox.querySelector('.refreshing-tag').innerHTML = refreshingTag;
}