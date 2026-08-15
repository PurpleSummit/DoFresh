// INIT code

let fillTextArray = ['📝 a blank canvas here!\n', "goodness me, look at that! it's time to get going 🏃\n", 'you can do this! — blue 52 🐳\n', 'may the force be with you... ✊\n', 'lettuce commence. 🥬\n', 'go you! go you! 🎉\n']

document.addEventListener('DOMContentLoaded', () => {
    console.log(localStorage);

    // Activate sidebar link
    //document.querySelector('#sidebar-home-link').className = 'nav-link active';

    // Refreshing mechanism
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    const today = new Date(date.getTime() - offset).toISOString().split('T')[0]; // Formatting into local-time ISO string

    let lastAccessedDate = localStorage.getItem('lastAccessedDate');

    // DEBUG REFRESHING ☑️
    console.log("New date?", lastAccessedDate != today);

    if (lastAccessedDate == null) {
        localStorage.setItem('lastAccessedDate', today);
    }
    else {
        if (today != lastAccessedDate) {

            // Get all the refreshing to-do boxes
            let todoBoxes = Object.entries(localStorage).filter((entry) => Number.isInteger(+entry[0]));
            let allRefreshingTodoBoxes = [];
            todoBoxes.forEach(boxData => {
                if (JSON.parse(boxData[1]).refreshing) {
                    allRefreshingTodoBoxes.push(boxData[0]);
                }
            });

            const diff = (new Date(today) - new Date(lastAccessedDate)) / (1000 * 60 * 60 * 24);

            allRefreshingTodoBoxes.forEach(todoBoxId => {
                let todoBoxData = JSON.parse(localStorage.getItem(todoBoxId));

                // Process the active tasks and break their streaks
                todoBoxData.tasks.active.forEach(taskData => {
                    if (!taskData || !taskData.completedDates) return;

                    let completedDateRanges = taskData.completedDates;
                    let recentCompletedPair = completedDateRanges.at(-1);

                    // If there was an ongoing streak, it ended the day before lastAccessedDate (the task wasn't completed on lastAccessedDate)
                    if (recentCompletedPair && recentCompletedPair[1] === null) {
                        let previousDate = new Date(lastAccessedDate);
                        previousDate.setDate(previousDate.getDate() - 1);

                        recentCompletedPair[1] = previousDate.toISOString().split('T')[0];
                    }
                });

                // Process the completed tasks and break their streaks
                todoBoxData.tasks.completed.forEach(taskData => {
                    if (!taskData || !taskData.completedDates) return;

                    let completedDateRanges = taskData.completedDates;
                    let recentCompletedPair = completedDateRanges.at(-1);

                    // If the user didn't access the website for more than 1 day
                    // All ongoing streaks were broken with lastAccessedDate as the final date
                    if (diff > 1) {
                        // If a streak was ongoing, ended on lastAccessedDate
                        if (recentCompletedPair && recentCompletedPair[1] === null) {
                            recentCompletedPair[1] = lastAccessedDate;
                        }
                        // If no ongoing streak, add a one-day streak
                        else {
                            taskData.completedDates.push([lastAccessedDate, lastAccessedDate]);
                        }
                    }
                    else {
                        if (completedDateRanges.length >= 1) {
                            // If there was a closed streak, start a new streak
                            if (recentCompletedPair && recentCompletedPair[1] !== null) {
                                taskData.completedDates.push([lastAccessedDate, null]);
                            }
                        }
                        // If there were no completed dates yet but the task was completed
                        else {
                            taskData.completedDates = [[lastAccessedDate, null]];
                        }
                    }
                });

                // Refresh the completed tasks
                todoBoxData.tasks.active = todoBoxData.tasks.active.concat(todoBoxData.tasks.completed);
                todoBoxData.tasks.completed = [];

                localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));
            });

            localStorage.setItem('lastAccessedDate', today);
        }
    }

    // Display sidebar to-do lists and add main HTML
    const sidebarList = document.querySelector('#home-lists');
    const allTodoBoxIds = Object.keys(localStorage).filter(key => Number.isInteger(+key));
    allTodoBoxIds.sort((a, b) => a - b);

    allTodoBoxIds.forEach(boxId => {
        addHTMLTodoBox(boxId);
    });

    if (allTodoBoxIds.length < 1) {
        fillIfBlank(document.body);
    }

    setListeners();
});

// LOGIC code

function setListeners() {
    // To-do task buttons
    let allAddTaskButtons = document.querySelectorAll('.add-task-btn');

    allAddTaskButtons.forEach(button => {
        button.onclick = () => {
            addTask(button);
        };
    });

    let allTodoTasks = document.querySelectorAll('.todo-task-text');

    allTodoTasks.forEach(textbox => {
        textbox.onfocus = () => {
            textbox.parentElement.dataset.bsToggle = 'disabled';
        };

        textbox.addEventListener('focusout', () => {
            textbox.parentElement.dataset.bsToggle = 'collapse';
            editTask(textbox);
        });
    });

    let allTodoDetails = document.querySelectorAll('.todo-task-details');

    allTodoDetails.forEach(textarea => {
        textarea.addEventListener('focusout', () => {
            editTaskDetails(textarea);
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

    // Closing accordion when clicked elsewhere
    window.onclick = () => {
        let openAccordions = document.querySelectorAll('.collapse.show');

        openAccordions.forEach(accordion => {
            var bsCollapse = new bootstrap.Collapse(accordion, {
                toggle: true
            });
        });
    };

    let allAccordions = document.querySelectorAll('.accordion-item');
    allAccordions.forEach(accordion => {
        accordion.onclick = (event) => {
            var bsCollapse = new bootstrap.Collapse(accordion, {
                toggle: false
            });
            event.stopPropagation();
        };
    });

    let allEditTaskBtns = document.querySelectorAll('.edit-todo-task-btn');
    allEditTaskBtns.forEach(btn => {
        btn.onfocus = () => {
            btn.parentElement.dataset.bsToggle = 'disabled';
            btn.parentElement.querySelector('.dropdown-menu').classList.toggle('collapsed');
        };

        btn.onblur = () => {
            btn.parentElement.dataset.bsToggle = 'collapse';
            btn.parentElement.querySelector('.dropdown-menu').classList.toggle('collapsed');
        };
    });

    let allAddSubtaskBtns = document.querySelectorAll('.add-subtask-btn');
    allAddSubtaskBtns.forEach(btn => {
        btn.onclick = () => {
            addSubtask(btn);
        };
    });
}

function fillIfBlank(parentElement) {
    let oldFillText = parentElement.querySelector('.blank-todo-fill');
    if (oldFillText) {
        oldFillText.remove();
    }

    const span = document.createElement('span');
    span.className = 'blank-todo-fill';

    let randomText = fillTextArray[Math.floor(Math.random() * fillTextArray.length)];
    span.textContent = randomText;

    parentElement.appendChild(span);
}

// TO-DO LIST code

function addTodoBox() {
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
        let fillInText = document.querySelector('.blank-todo-fill:not(.todo-box .blank-todo-fill)');
        if (fillInText) {
            fillInText.remove();
        }

        refreshingBool = true;
        addBoxModal.hide();

        let todoBoxData = { title: 'Refreshing To-Do List', tasks: { active: [], completed: [] }, refreshing: false };
        localStorage.setItem(newBoxId, JSON.stringify(todoBoxData));

        addHTMLTodoBox(newBoxId);
        makeRefreshingTodoBox(newBoxId);
    };

    standardBoxButton.onclick = () => {
        let fillInText = document.querySelector('.blank-todo-fill:not(.todo-box .blank-todo-fill)');
        if (fillInText) {
            fillInText.remove();
        }

        refreshingBool = false;
        addBoxModal.hide();

        let todoBoxData = { title: 'To-Do List', tasks: { active: [], completed: [] }, refreshing: false };
        localStorage.setItem(newBoxId, JSON.stringify(todoBoxData));

        addHTMLTodoBox(newBoxId);
    };
}

function renameTodoBox(button) {
    const parentTodoBox = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');
    let todoBoxData = JSON.parse(localStorage[todoBoxId]);

    const todoTitleHeader = parentTodoBox.querySelector('.todo-title');

    const renameModalInput = document.querySelector('#modal-rename-input');
    const renameModalButton = document.querySelector('#modal-rename-button');

    renameModalInput.value = todoTitleHeader.textContent;

    renameModalButton.onclick = () => {
        const renamedTitle = renameModalInput.value;

        if (renamedTitle == "" || renamedTitle == null) {
            return;
        }
        else {
            todoBoxData.title = renamedTitle;
            localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

            todoTitleHeader.textContent = todoBoxData.title;
        }

        let renameModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('exampleModal'));
        renameModal.hide();
    };
}

function removeTodoBox(button) {
    const parentTodoBox = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    const removeModalButton = document.querySelector('#modal-remove-button');

    removeModalButton.onclick = () => {
        let removeModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('removeTodoBoxModal'));
        removeModal.hide();

        localStorage.removeItem(todoBoxId);

        const todoBoxesDiv = document.querySelector('.todo-box-div');
        todoBoxesDiv.removeChild(parentTodoBox);

        if (Object.keys(localStorage).length < 2) {
            fillIfBlank(todoBoxesDiv);
        }
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

// TO-DO TASK code

function addTask(button) {

    const todoBox = button.parentElement.parentElement.parentElement;
    const parentTodoBox = todoBox.querySelector('.todo-box-tasks');

    // Remove the fill-in paragraph if needed
    let fillInText = parentTodoBox.querySelector('.blank-todo-fill');
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
        return;
    }

    // Creating a new id for the new task
    let newTaskId = "task_" + Date.now();

    if (todoBoxData.refreshing) {
        todoBoxData.tasks.active.push({ taskId: `${newTaskId}`, task: 'New task!', details: '', subTasks: [], createdDate: new Date().toISOString().split('T')[0], completedDates: [] });
    }
    else {
        todoBoxData.tasks.active.push({ taskId: `${newTaskId}`, task: 'New task!', details: '', subTasks: [], createdDate: new Date().toISOString().split('T')[0] });
    }

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // ⛰️ Create a todo-task div and add it
    addHTMLTodoTask(todoBoxId, newTaskId, true);

    document.querySelector(`#${newTaskId}`).querySelector('.todo-task-text').focus();

    setListeners();
}

function addSubtask(button) {
    let taskElement = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let parentTaskId = taskElement.id;

    let parentTodoBox = taskElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    // Creating a new id for the new task
    let newTaskId = "task_" + Date.now();

    // ✨ Add the new task to localStorage
    let todoBoxData = localStorage.getItem(todoBoxId);

    if (todoBoxData) {
        todoBoxData = JSON.parse(todoBoxData);
    }
    else {
        return;
    }

    let parentTaskData = todoBoxData.tasks['active'].find(task => task['taskId'] == parentTaskId);

    if (!parentTaskData) {
        console.log(`Parent task ${parentTaskId} not found in active tasks.`);
        return;
    }

    if (!parentTaskData['subTasks']) {
        console.log(`Parent task ${parentTaskId} doesn't have an array subTasks.`);
        return;
    }
    parentTaskData['subTasks'].push(`${newTaskId}`);

    // Add the new subtask object to localStorage
    let newSubtaskObject;
    if (todoBoxData.refreshing) {
        newSubtaskObject = { taskId: `${newTaskId}`, task: 'New task!', details: '', parentTask: `${parentTaskId}`, createdDate: new Date().toISOString().split('T')[0], completedDates: [] };
    }
    else {
        newSubtaskObject = { taskId: `${newTaskId}`, task: 'New task!', details: '', parentTask: `${parentTaskId}`, createdDate: new Date().toISOString().split('T')[0] };
    }
    todoBoxData.tasks['active'].push(newSubtaskObject);

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // ⛰️ Create a todo-task div and add it
    addHTMLTodoTask(todoBoxId, newTaskId, true);

    // Focus on the task
    let newSubtaskElement = document.querySelector(`#${newTaskId}`);
    if (newSubtaskElement) {
        newSubtaskElement.querySelector('.todo-task-text').focus();
    }

    setListeners();
}

function completeTask(radio) {
    let taskElement = radio.parentElement.parentElement.parentElement;
    let taskId = taskElement.id;
    let parentTodoBox = taskElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '')

    let todoBoxData = JSON.parse(localStorage.getItem(todoBoxId));
    if (!todoBoxData) return;

    let idsToChange = [taskId];

    let taskData = todoBoxData.tasks.active.find((t => t['taskId'] == taskId));

    let previousState = 'active';
    if (!taskData) {
        previousState = 'completed';
        taskData = todoBoxData.tasks.completed.find(t => t['taskId'] == taskId);
    }

    // If active, mainstream task, all its subtasks should be completed too
    if (previousState === 'active' && taskData['subTasks']?.length > 0) {
        idsToChange = [...idsToChange, ...taskData['subTasks']];
    }
    // If completed subtask, then its parentTask should be restored too
    //else if (previousState === 'completed' && taskData['parentTask']) {
    //    idsToChange.push(taskData['parentTask']);
    //}

    const allTasks = [...todoBoxData.tasks.active, ...todoBoxData.tasks.completed]
    let tasksToChange = allTasks.filter(t => idsToChange.includes(t['taskId']));

    // Complete the task and possibly its subtasks
    if (previousState == 'active') {
        todoBoxData.tasks.active = todoBoxData.tasks.active.filter(t => !idsToChange.includes(t['taskId']));

        // Prevent duplicate entries
        const ongoingCompleted = todoBoxData.tasks.completed.filter(t => !idsToChange.includes(t['taskId']));
        todoBoxData.tasks.completed = ongoingCompleted.concat(tasksToChange);
    }
    // Restore tasks to active. Only one at a time, whether mainstream or subtask.
    else {
        // Prevent duplicate entries
        const ongoingActive = todoBoxData.tasks.active.filter(t => !idsToChange.includes(t['taskId']));
        todoBoxData.tasks.active = ongoingActive.concat(tasksToChange);

        todoBoxData.tasks.completed = todoBoxData.tasks.completed.filter(t => !idsToChange.includes(t['taskId']));
    }

    // Save changes
    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    // 🗻 Update DOM elements
    idsToChange.forEach(id => {
        console.log(id);
        let oldTaskElement = document.querySelector(`#${id}`);

        if (oldTaskElement) {
            oldTaskElement.remove();
            console.log("Removing", oldTaskElement);
        }

        if (previousState === 'completed') {
            console.log("Adding", id);
            addHTMLTodoTask(todoBoxId, id, true);
        }
    });

    // Updates all the tasks in completed-tasks div & removes elements if no tasks left
    updateHTMLCollapseDiv(todoBoxId);

    // If no active tasks anymore
    if (todoBoxData.tasks.active.length < 1) {
        fillIfBlank(parentTodoBox.querySelector('.todo-box-tasks'));
    }

    setListeners();
}

function editTask(textbox) {
    let taskElement = textbox.parentElement.parentElement.parentElement;
    let taskId = taskElement.id;

    let parentTodoBox = taskElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    // ✨ Change the task's content in localStorage
    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    let targetTask = todoBoxData.tasks.active.find(task => task['taskId'] == taskId);

    if (targetTask) {
        targetTask['task'] = textbox.value;
    }

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));
}

function editTaskDetails(textarea) {
    let taskElement = textarea.parentElement.parentElement.parentElement;
    let taskId = taskElement.id;

    let parentTodoBox = taskElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    // ✨ Change the task's content in localStorage
    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    let targetTask = todoBoxData.tasks.active.find(task => task['taskId'] == taskId);

    if (targetTask) {
        targetTask['details'] = textarea.value;
    }

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));
}

function removeTask(button) {
    let taskElement = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let taskId = taskElement.id;
    let parentTodoBox = taskElement.parentElement.parentElement;
    let todoBoxId = parentTodoBox.id.replace('todo-box', '');

    let todoBoxData = JSON.parse(localStorage.getItem(todoBoxId));
    if (!todoBoxData) return;

    let tasksToRemove = [taskId];

    let taskData = todoBoxData.tasks.active.find((t => t['taskId'] == taskId)) || todoBoxData.tasks.completed.find(t => t['taskId'] == taskId);

    // Gather all associated sub-tasks recursively
    if (taskData['subTasks'] && taskData['subTasks'].length > 0) {
        taskData['subTasks'].forEach(subId => {
            tasksToRemove.push(subId);
        });
    }

    // If it's a subtask, remove its ID from its parent task's subTasks array
    if (taskData['parentTask']) {
        let parentTaskId = taskData['parentTask'];

        let parentTaskData = todoBoxData.tasks.active.find(t => t['taskId'] == parentTaskId) || todoBoxData.tasks.completed.find(t => t['taskId'] == parentTaskId);

        if (parentTaskData && parentTaskData['subTasks']) {
            parentTaskData['subTasks'] = parentTaskData['subTasks'].filter(subId => subId != taskId);
        }
    }

    todoBoxData.tasks.active = todoBoxData.tasks.active.filter(t => !tasksToRemove.includes(t['taskId']));
    todoBoxData.tasks.completed = todoBoxData.tasks.completed.filter(t => !tasksToRemove.includes(t['taskId']));

    localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));

    tasksToRemove.forEach(id => {
        let element = document.querySelector(`#${id}`);
        if (element) element.remove();
    });

    // ⛰️ Fix the # of completed tasks
    updateHTMLCollapseDiv(todoBoxId);

    // If there are no active tasks left, fill in the blank
    if (todoBoxData.tasks.active.length < 1) {
        fillIfBlank(parentTodoBox.querySelector('.todo-box-tasks'));
    }
}

// HTML code

function addHTMLTodoBox(boxId) {
    let todoBoxData = localStorage.getItem(boxId);
    todoBoxData = JSON.parse(todoBoxData);

    let box = document.createElement('div');
    box.className = 'todo-box';
    box.id = `todo-box${boxId}`;

    let boxTitle = todoBoxData.title;

    let refreshingTag = '';
    if (todoBoxData.refreshing) {
        refreshingTag = 'Refreshing';
    }

    box.innerHTML = `
    <div class='todo-box-heading'>
        <h2 class='todo-title'>${boxTitle}</h2>
        <div class="btn-group">
            <span class="badge text-bg-primary refreshing-tag">${refreshingTag}</span>
            <button class='add-task-btn'>+</button>
            <button type="button" class="edit-todo-box-btn" data-bs-toggle="dropdown" aria-expanded="false" data-toggle="dropdown">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                    <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                </svg>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item rename-todo-box-btn" href="#" data-bs-toggle="modal" data-bs-target="#exampleModal">Rename</a></li>
                <li><a class="dropdown-item remove-todo-box-btn" href="#" data-bs-toggle="modal"
                data-bs-target="#removeTodoBoxModal">Delete</a></li>
            </ul>
        </div>
    </div>
    <div class='todo-box-tasks accordion accordion-flush' id='accordion-flush${boxId}'>
    </div>`;

    let todoBoxDiv = document.querySelector('.todo-box-div');
    todoBoxDiv.appendChild(box);

    if (todoBoxData.tasks.active.length >= 1) {
        (todoBoxData.tasks.active).forEach((task) => {
            let taskId = task['taskId'];
            let taskText = task['task'];

            addHTMLTodoTask(boxId, taskId, true);
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

function addHTMLCollapseDiv(todoBoxId) {
    const box = document.querySelector(`#todo-box${todoBoxId}`);

    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    let collapseToggle = document.createElement('div');
    collapseToggle.className = 'collapse-btn-div d-inline-flex gap-1';
    collapseToggle.innerHTML = `<button class="btn collapse-btn" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample${todoBoxId}" aria-expanded="false" aria-controls="collapseExample${todoBoxId}">
        Completed (${todoBoxData.tasks.completed.length})
    </button>`;
    box.appendChild(collapseToggle);

    const collapseDiv = document.createElement('div');
    collapseDiv.className = 'collapse todo-box-completed-tasks accordion accordion-flush';
    collapseDiv.id = `collapseExample${todoBoxId}`;
    box.appendChild(collapseDiv);
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

    collapseToggle.innerHTML = `<button class="btn collapse-btn" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample${todoBoxId}" aria-expanded="false" aria-controls="collapseExample${todoBoxId}">
        Completed (${todoBoxData.tasks.completed.length})</button>`;

    // Wipe the original completed-tasks div and update
    todoBox.querySelector('.todo-box-completed-tasks').innerHTML = '';

    (todoBoxData.tasks.completed).forEach((task) => {
        let taskId = task['taskId'];

        addHTMLTodoTask(todoBoxId, taskId, false);
    });

    // If no completed tasks
    if (todoBoxData.tasks.completed.length < 1) {
        let completedDiv = todoBox.querySelector('.todo-box-completed-tasks');
        completedDiv.remove();
        let completedButton = todoBox.querySelector('.collapse-btn-div');
        todoBox.removeChild(completedButton);
    }

    setListeners();
}

function addHTMLTodoTask(todoBoxId, taskId, active) {
    let todoBoxData = localStorage.getItem(todoBoxId);
    todoBoxData = JSON.parse(todoBoxData);

    let addSubtask, subtaskClass;
    let allTasks, checked, disabled, completed;
    if (active) {
        allTasks = todoBoxData.tasks['active'];
        checked = "";
        disabled = "";
        completed = "";
        addSubtask = `
        <li><a class='dropdown-item add-subtask-btn'${disabled}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-return-right" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5"/>
            </svg>Add a subtask</a>
        </li>`;
    }
    else {
        allTasks = todoBoxData.tasks['completed'];
        checked = " checked";
        disabled = " disabled";
        completed = "-completed";
        addSubtask = '';
    }

    let taskData = allTasks.find(task => task['taskId'] == taskId);

    let parentTaskId = taskData['parentTask'];
    if (parentTaskId) {
        addSubtask = '';
        subtaskClass = 'subtask';
    }

    let taskText = taskData.task;
    let taskDetails = taskData.details;

    let tasksDiv = document.querySelector(`#todo-box${todoBoxId}`).querySelector(`.todo-box${completed}-tasks`);

    const taskElement = document.createElement('div');
    taskElement.className = 'todo-task accordion-item';
    taskElement.id = `${taskId}`;
    taskElement.innerHTML = `
        <h2 class="accordion-header">
            <div class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#details-${taskId}" aria-expanded="false" aria-controls="details-${taskId}">
                <input type='radio'${checked}>
                <input type='text' class='todo${completed}-task-text' value='${taskText}'${disabled}>
                <button type="button" class="btn edit-todo-task-btn" data-bs-toggle="dropdown" aria-expanded="false" data-toggle="dropdown">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                    </svg>
                </button>
                <ul class="task-edit-dropdown dropdown-menu dropdown-menu-end collapsed">
                    <li><a class='dropdown-item remove-task-btn'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>Delete</a>
                    </li>
                    ${addSubtask}
                </ul>
            </button>
        </h2>
        <div id="details-${taskId}" class="accordion-collapse collapse" data-bs-parent="#accordion-flush${todoBoxId}">
            <div class="form-floating accordion-body" style="padding: 0px;">
                <textarea id='details-${taskId}-textarea' class='form-control todo${completed}-task-details' placeholder='Leave the details here'${disabled}>${taskDetails}</textarea>
                <label for="details-${taskId}-textarea">Details</label>
            </div>
    </div>`;

    const hasMatchingParentTask = parentTaskId && (allTasks.some(t => t['taskId'] == parentTaskId) && allTasks.some(t => t['taskId'] == taskId));

    if (hasMatchingParentTask) {
        taskElement.className = 'todo-task accordion-item subtask';
        let parentTaskElement = document.querySelector(`#${parentTaskId}`);
        if (parentTaskElement) parentTaskElement.after(taskElement);
    }
    else {
        if (!active && !tasksDiv) {
            addHTMLCollapseDiv(todoBoxId);
            
            // Set tasksDiv again
            tasksDiv = document.querySelector(`#todo-box${todoBoxId}`).querySelector(`.todo-box-completed-tasks`);
        }
        if (tasksDiv) {
            tasksDiv.prepend(taskElement);
        }
    }

    setListeners();
}
