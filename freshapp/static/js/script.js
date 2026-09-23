import { lumiStaticImg, lumiJump } from './lumi.js';

// INIT code
let today = new Date();
today.setHours(0, 0, 0, 0);
let yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
let todayStr = toSimpleISOString(today);
let yesterdayStr = toSimpleISOString(yesterday);

function initCode() {
    allListIds.forEach(listId => {
        console.log(listId);
        addHTMLTodoBox(listId);
    });

    if (allListIds.length < 1) document.getElementById('todo-screen-filler').style.display = 'block';

    iDidList();
}

let fillTextArray = ['📝 a blank canvas here!\n', "goodness me, look at that! it's time to get going 🏃\n", 'you can do this! — blue 52 🐳\n', 'may the force be with you... ✊\n', 'lettuce commence. 🥬\n', 'go you! go you! 🎉\n']

// Fetch todo list data
const response = await fetch('api/get-lists/');
const todoListsData = await response.json();
const allListIds = todoListsData["todo-lists"].map(todoList => todoList.id);
console.log(allListIds);

if (document.readyState !== 'loading') {
    initCode();
} else {
    document.addEventListener("DOMContentLoaded", initCode);
}

// LISTENERS code
document.addEventListener("click", (event) => {
    if (event.target.closest('.add-todo-box-btn')) addTodoBox();
    if (event.target.closest('.add-task-btn')) addTask(event.target.closest('.add-task-btn'));
    if (event.target.closest('.rename-todo-box-btn')) renameTodoBox(event.target.closest('.rename-todo-box-btn'));
    if (event.target.closest('.remove-todo-box-btn')) removeTodoBox(event.target.closest('.remove-todo-box-btn'));
    if (event.target.closest('.add-subtask-btn')) addSubtask(event.target.closest('.add-subtask-btn'));
    if (event.target.closest('.remove-task-btn')) removeTask(event.target.closest('.remove-task-btn'));
    if (event.target.closest('.complete-refreshing-task-btn')) completeRefreshingTask();

    const radio = event.target.closest('input[type="radio"]');
    if (radio) completeTask(radio);

    // Closing accordion when clicked elsewhere
    if (!event.target.closest('.accordion-item')) {
        let openDropdowns = document.querySelectorAll('.collapse.show');

        openDropdowns.forEach(dropdown => {
            let bsCollapse = bootstrap.Collapse.getInstance(dropdown) || new bootstrap.Collapse(dropdown);
            bsCollapse.hide();
        });
    }
});

/*
let allAccordions = document.getElementsByClassName('accordion-item');
Array.from(allAccordions).forEach(accordion => {
    accordion.onclick = (event) => {

        event.stopPropagation();
        var bsCollapse = new bootstrap.Collapse(accordion, {
            toggle: false
        });
    };
});
*/

document.addEventListener('show.bs.collapse', (event) => {
    if (document.activeElement.closest('.todo-task-text') || document.activeElement.closest('.todo-task-details')) {
        event.preventDefault();
    }
});

document.addEventListener('hide.bs.collapse', (event) => {
    if (document.activeElement.closest('.todo-task-text') || document.activeElement.closest('.todo-task-details')) {
        event.preventDefault();
    }
});

document.addEventListener('focusin', (event) => {
    const textarea = event.target.closest('.todo-task-text, .todo-task-details');
    if (!textarea) return;

    textarea.addEventListener('blur', () => {
        if (textarea.classList.contains('todo-task-text')) {
            editTask(textarea);
        } else if (textarea.classList.contains('todo-task-details')) {
            editTaskDetails(textarea);
        }
    }, { once: true });
});

document.addEventListener('keydown', (event) => {
    const textarea = event.target.closest('.todo-task-text, .todo-task-details');

    if (textarea && event.key === 'Enter') {
        event.preventDefault();
        editTask(textarea);
        textarea.blur();
    }
});

// LOGIC code

function iDidList() {
    document.getElementsByClassName('i-did-body')[0].innerHTML = ``;

    let current = new Date(today);

    let datesArray = [];

    for (let i = 0; i < 8; i++) {
        datesArray.push(new Date(current));

        let currentStr = toSimpleISOString(current);

        let iDidDateHeader = document.createElement('div');
        iDidDateHeader.className = 'i-did-date-header';
        iDidDateHeader.id = `i-did-header-${currentStr}`;
        iDidDateHeader.innerHTML = `<h5>${ISOToDateString(currentStr)}</h5>`

        document.getElementsByClassName('i-did-body')[0].appendChild(iDidDateHeader);

        current.setDate(current.getDate() - 1);
    }

    Array.from(allListIds).forEach(listId => {
        let boxData = JSON.parse(localStorage.getItem(listId));

        // If it's a refreshing list, log one week's worth of past completions
        if (boxData.refreshing) {
            datesArray.forEach(date => {
                // Task's range of completed dates
                let tasks = boxData.tasks.active.concat(boxData.tasks.completed);
                if (tasks && tasks.length > 0) {
                    tasks.forEach(task => {
                        let completedDates = task.completedDates;

                        for (const range of completedDates) {
                            let dateOneParts = range[0].split('-');
                            let dateOne = new Date(dateOneParts[0], dateOneParts[1] - 1, dateOneParts[2]);

                            let dateTwoParts = range[1];
                            let dateTwo;
                            if (dateTwoParts === null) {
                                dateTwo = new Date(yesterday);
                            }
                            else {
                                dateTwoParts = dateTwoParts.split('-');
                                dateTwo = new Date(dateTwoParts[0], dateTwoParts[1] - 1, dateTwoParts[2]);
                            }

                            // If the task was completed on `date`, then add the task to the I Did list for that date 
                            if (dateOne <= date && date <= dateTwo) {
                                let taskId = task.taskId;
                                let completedDate = toSimpleISOString(date);

                                let completedTag = `${completedDate}`;
                                if (completedDate == todayStr) {
                                    completedTag += 'Today';
                                }
                                else if (completedDate == yesterdayStr) {
                                    completedTag += 'Yesterday';
                                }

                                addHTMLTaskIDid(listId, taskId, completedDate);
                            }
                        }
                    });
                }
            });
        }

        // Display all the completions
        let completedTasks = boxData.tasks.completed.filter(task => !task.completedForGood);
        if (completedTasks && completedTasks.length > 0) {
            completedTasks.forEach(taskData => {
                let taskId = taskData.taskId;
                let completedDate = taskData.completedDate || todayStr;

                if (!document.getElementById(`i-did-header-${completedDate}`)) {
                    let iDidDateHeader = document.createElement('div');
                    iDidDateHeader.className = 'i-did-date-header';
                    iDidDateHeader.id = `i-did-header-${completedDate}`;
                    iDidDateHeader.innerHTML = `<h5>${ISOToDateString(completedDate)}</h5>`
                }

                addHTMLTaskIDid(listId, taskId, completedDate);

            });
        }

        let emptyHeaders = document.querySelectorAll('.i-did-date-header:not(:has(.i-did-todo-task))');
        emptyHeaders.forEach(headerDiv => {
            headerDiv.style.display = 'none';
        });
        let otherHeaders = document.querySelectorAll('.i-did-date-header:has(.i-did-todo-task)');
        otherHeaders.forEach(headerDiv => {
            headerDiv.style.display = 'block';
        });
    });

    if (allListIds.length < 1) {
        let emptyHeaders = document.getElementsByClassName('i-did-date-header');
        Array.from(emptyHeaders).forEach(headerDiv => {
            headerDiv.style.display = 'none';
        });
    }

    if (document.getElementsByClassName('i-did-todo-task').length < 1 || allListIds.length < 1) {
        document.getElementsByClassName('i-did-body')[0].innerHTML = `<div id="i-did-filler">
            <img src="../static/img/i-did-filler.svg"
                alt="zero state illustration of minimalist, checked button">
            <h5>Time to get crack-a-lacking!</h5>
            <p>We're excited to see how this will fill 😉</p>
        </div>`;
    }
}

function fillIfBlank(parentElement) {
    let oldFillText = parentElement.getElementsByClassName('blank-todo-fill')[0];
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
    const refreshingBoxButton = document.getElementById('add-refreshing-box-button');
    const standardBoxButton = document.getElementById('add-standard-box-button');

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
        let fillInText = document.querySelector('blank-todo-fill:not(.todo-box .blank-todo-fill)');
        if (fillInText) {
            fillInText.remove();
        }

        let boxTitle = document.getElementById('name-todo-box').value;

        addBoxModal.hide();

        let todoBoxData = { title: boxTitle, tasks: { active: [], completed: [] }, refreshing: false };
        localStorage.setItem(newBoxId, JSON.stringify(todoBoxData));

        // Remove the existing zero state filler image
        document.getElementById('todo-screen-filler').style.display = 'none';

        document.getElementById('name-todo-box').value = '';

        addHTMLTodoBox(newBoxId);
        makeRefreshingTodoBox(newBoxId);
    };

    standardBoxButton.onclick = () => {
        let fillInText = document.querySelector('blank-todo-fill:not(.todo-box .blank-todo-fill)');
        if (fillInText) {
            fillInText.remove();
        }

        addBoxModal.hide();

        let boxTitle = document.getElementById('name-todo-box').value;

        let todoBoxData = { title: boxTitle, tasks: { active: [], completed: [] }, refreshing: false };
        localStorage.setItem(newBoxId, JSON.stringify(todoBoxData));

        // Remove the existing zero state filler image
        document.getElementById('todo-screen-filler').style.display = 'none';

        document.getElementById('name-todo-box').value = '';

        addHTMLTodoBox(newBoxId);
    };
}

function renameTodoBox(button) {
    const parentTodoBox = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let listId = parentTodoBox.id.replace('todo-box', '');
    let todoBoxData = JSON.parse(localStorage[listId]);

    const todoTitleHeader = parentTodoBox.getElementsByClassName('todo-title')[0];

    const renameModalInput = document.getElementById('modal-rename-input');
    const renameModalButton = document.getElementById('modal-rename-button');

    renameModalInput.value = todoTitleHeader.textContent;

    renameModalButton.onclick = () => {
        const renamedTitle = renameModalInput.value;

        if (renamedTitle == "" || renamedTitle == null) {
            return;
        }
        else {
            todoBoxData.title = renamedTitle;
            localStorage.setItem(listId, JSON.stringify(todoBoxData));

            todoTitleHeader.textContent = todoBoxData.title;
        }

        let renameModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('exampleModal'));
        renameModal.hide();
    };
}

function removeTodoBox(button) {
    const parentTodoBox = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let listId = parentTodoBox.id.replace('todo-box', '');

    const removeModalButton = document.getElementById('modal-remove-button');

    removeModalButton.onclick = () => {
        let removeModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('removeTodoBoxModal'));
        removeModal.hide();

        localStorage.removeItem(listId);

        const todoBoxesDiv = document.getElementsByClassName('todo-box-div')[0];
        todoBoxesDiv.removeChild(parentTodoBox);

        // Update allListIds and add screen filler if needed
        allListIds = Object.keys(localStorage).filter(key => Number.isInteger(+key));
        allListIds.sort((a, b) => a - b);

        if (allListIds.length < 1) document.getElementById('todo-screen-filler').style.display = 'block';
    };
}

function makeRefreshingTodoBox(listId) {
    let todoBoxData = JSON.parse(localStorage[listId]);
    let parentTodoBox = document.getElementById(`todo-box${listId}`);

    // ✨ Change the refreshing bool and update localStorage
    todoBoxData.refreshing = true;

    localStorage.setItem(listId, JSON.stringify(todoBoxData));

    // ⛰️ Update the todo box HTML to be a refreshing / standard to-do list
    let refreshingTag = '';
    if (todoBoxData.refreshing) {
        refreshingTag = 'Refreshing';
    }

    parentTodoBox.getElementsByClassName('refreshing-tag')[0].innerHTML = refreshingTag;
}

// TO-DO TASK code

function addTask(button) {
    const todoBox = button.parentElement.parentElement.parentElement;
    const parentTodoBox = todoBox.getElementsByClassName('todo-box-tasks')[0];

    // Remove the fill-in paragraph if needed
    let fillInText = parentTodoBox.getElementsByClassName('blank-todo-fill')[0];
    if (fillInText) {
        fillInText.remove();
    }

    // ✨ Add the new task to localStorage
    let listId = todoBox.id.replace('todo-box', '');
    let todoBoxData = localStorage.getItem(listId);

    if (todoBoxData) {
        todoBoxData = JSON.parse(todoBoxData);
    }
    else {
        return;
    }

    // Creating a new id for the new task
    let newTaskId = "task_" + Date.now();

    if (todoBoxData.refreshing) {
        todoBoxData.tasks.active.push({ taskId: `${newTaskId}`, task: '', details: '', parentTodoBox: listId, subTasks: [], createdDate: toSimpleISOString(new Date()), completedDates: [], completedForGood: false });
    }
    else {
        todoBoxData.tasks.active.push({ taskId: `${newTaskId}`, task: '', details: '', parentTodoBox: listId, subTasks: [], createdDate: toSimpleISOString(new Date()), completedDate: '' });
    }

    localStorage.setItem(listId, JSON.stringify(todoBoxData));

    // ⛰️ Create a todo-task div and add it
    addHTMLTask(listId, newTaskId, true);

    document.getElementById(`${newTaskId}`).getElementsByClassName('todo-task-text')[0].focus();
}

function addSubtask(button) {
    let parentTaskId = getIdsFromDropdown(button)[0];
    let listId = getIdsFromDropdown(button)[1];

    // Creating a new id for the new task
    let newTaskId = "task_" + Date.now();

    // ✨ Add the new task to localStorage
    let todoBoxData = localStorage.getItem(listId);

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
        newSubtaskObject = { taskId: `${newTaskId}`, task: '', details: '', parentTodoBox: listId, parentTask: `${parentTaskId}`, createdDate: toSimpleISOString(new Date()), completedDates: [], completedForGood: false };
    }
    else {
        newSubtaskObject = { taskId: `${newTaskId}`, task: '', details: '', parentTodoBox: listId, parentTask: `${parentTaskId}`, createdDate: toSimpleISOString(new Date()), completedDate: '' };
    }
    todoBoxData.tasks['active'].push(newSubtaskObject);

    localStorage.setItem(listId, JSON.stringify(todoBoxData));

    // ⛰️ Create a todo-task div and add it
    addHTMLTask(listId, newTaskId, true);

    // Focus on the task
    let newSubtaskElement = document.getElementById(`${newTaskId}`);
    if (newSubtaskElement) {
        newSubtaskElement.getElementsByClassName('todo-task-text')[0].focus();
    }
}

function completeTask(radio) {
    const taskElement = radio.parentElement.parentElement.parentElement;
    const taskId = taskElement.id;
    const parentTodoBox = taskElement.parentElement.parentElement;
    const listId = parentTodoBox.id.replace('todo-box', '');

    let todoBoxData = JSON.parse(localStorage.getItem(listId));
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

    const allTasks = [...todoBoxData.tasks.active, ...todoBoxData.tasks.completed]
    let tasksToChange = allTasks.filter(t => idsToChange.includes(t['taskId']));

    // Complete the task and possibly its subtasks
    if (previousState == 'active') {
        // Change Lumi's costume
        lumiJump();

        todoBoxData.tasks.active = todoBoxData.tasks.active.filter(t => !idsToChange.includes(t['taskId']));

        tasksToChange.forEach(task => {
            if (task.completedDate === '') task.completedDate = `${toSimpleISOString(new Date())}`;
        });

        // Prevent duplicate entries
        const ongoingCompleted = todoBoxData.tasks.completed.filter(t => !idsToChange.includes(t['taskId']));
        todoBoxData.tasks.completed = ongoingCompleted.concat(tasksToChange);
    }
    // Restore tasks to active. Only one at a time, whether mainstream or subtask.
    else {
        // Prevent duplicate entries
        const ongoingActive = todoBoxData.tasks.active.filter(t => !idsToChange.includes(t['taskId']));
        todoBoxData.tasks.active = ongoingActive.concat(tasksToChange);

        tasksToChange.forEach(task => {
            if (task.completedDate) task.completedDate = '';
        });

        todoBoxData.tasks.completed = todoBoxData.tasks.completed.filter(t => !idsToChange.includes(t['taskId']));
    }

    // Save changes
    localStorage.setItem(listId, JSON.stringify(todoBoxData));

    // 🗻 Update DOM elements
    idsToChange.forEach(id => {
        let taskElement = document.getElementById(`${id}`);

        if (taskElement) taskElement.remove();

        if (previousState === 'completed') {
            addHTMLTask(listId, id, true);
        }
    });

    // Updates all the tasks in completed-tasks div & removes elements if no tasks left
    updateHTMLCollapseDiv(listId);
    iDidList();

    // If no active tasks anymore
    if (todoBoxData.tasks.active.length < 1) {
        fillIfBlank(parentTodoBox.getElementsByClassName('todo-box-tasks')[0]);
    }

    let fillInText = parentTodoBox.getElementsByClassName('blank-todo-fill')[0];
    if (todoBoxData.tasks.active.length > 0 && fillInText) {
        fillInText.remove();
    }
}

function completeRefreshingTask(button) {
    let taskId = getIdsFromDropdown(button)[0];
    let listId = getIdsFromDropdown(button)[1];

    let todoBoxData = JSON.parse(localStorage.getItem(listId));
    if (!todoBoxData) return;

    let idsToChange = [taskId];

    const allTasks = [...todoBoxData.tasks.active, ...todoBoxData.tasks.completed]
    let taskData = allTasks.find(task => task['taskId'] == taskId);

    // If active, mainstream task, all its subtasks should be completed too
    if (taskData['subTasks'] && taskData['subTasks']?.length > 0) {
        idsToChange = [...idsToChange, ...taskData['subTasks']];
    }

    let tasksToChange = allTasks.filter(t => idsToChange.includes(t['taskId']));

    // Complete the task and possibly its subtasks
    todoBoxData.tasks.active = todoBoxData.tasks.active.filter(t => !idsToChange.includes(t['taskId']));

    tasksToChange.forEach(task => {
        task.completedForGood = true;

        if (task.completedDates.length > 0 && task.completedDates.at(-1)[1] === null) {
            task.completedDates.at(-1)[1] = `${toSimpleISOString(new Date())}`;
        }
    });

    // Prevent duplicate entries
    const ongoingCompleted = todoBoxData.tasks.completed.filter(t => !idsToChange.includes(t['taskId']));
    todoBoxData.tasks.completed = ongoingCompleted.concat(tasksToChange);

    // Save changes
    localStorage.setItem(listId, JSON.stringify(todoBoxData));

    // 🗻 Update DOM elements
    idsToChange.forEach(id => {
        let taskElement = document.getElementById(`${id}`);

        if (taskElement) taskElement.remove();
    });

    // Updates all the tasks in completed-tasks div & removes elements if no tasks left
    updateHTMLCollapseDiv(listId);
    // updateHTMLCompletedForGoodDiv(listId);
    iDidList();

    // If no active tasks anymore
    if (todoBoxData.tasks.active.length < 1) {
        fillIfBlank(document.getElementById(`todo-box${listId}`).getElementsByClassName('todo-box-tasks')[0]);
    }
}

function editTask(textbox) {
    let taskElement = textbox.parentElement.parentElement.parentElement;
    let taskId = taskElement.id;

    let parentTodoBox = taskElement.parentElement.parentElement;
    let listId = parentTodoBox.id.replace('todo-box', '');

    // ✨ Change the task's content in localStorage
    let todoBoxData = localStorage.getItem(listId);
    todoBoxData = JSON.parse(todoBoxData);

    let targetTask = todoBoxData.tasks.active.find(task => task['taskId'] == taskId);

    if (targetTask) {
        targetTask['task'] = textbox.value;
    }

    localStorage.setItem(listId, JSON.stringify(todoBoxData));
}

function editTaskDetails(textarea) {
    let taskElement = textarea.parentElement.parentElement.parentElement;
    let taskId = taskElement.id;

    let parentTodoBox = taskElement.parentElement.parentElement;
    let listId = parentTodoBox.id.replace('todo-box', '');

    // ✨ Change the task's content in localStorage
    let todoBoxData = localStorage.getItem(listId);
    todoBoxData = JSON.parse(todoBoxData);

    let targetTask = todoBoxData.tasks.active.find(task => task['taskId'] == taskId);

    if (targetTask) {
        targetTask['details'] = textarea.value;
    }

    localStorage.setItem(listId, JSON.stringify(todoBoxData));
}

function removeTask(button) {
    // Locate all parent HTML for JSON IDs
    let taskId = getIdsFromDropdown(button)[0];
    let listId = getIdsFromDropdown(button)[1];

    let todoBoxData = JSON.parse(localStorage.getItem(listId));
    if (!todoBoxData) return;

    // Consolidate all the tasks that should be moved with the selected task
    let tasksToRemove = [taskId];

    let taskData = todoBoxData.tasks.active.find((t => t['taskId'] == taskId)) || todoBoxData.tasks.completed.find(t => t['taskId'] == taskId);

    // Gather all associated sub-tasks recursively
    if (taskData['subTasks'] !== undefined && taskData['subTasks'].length > 0) {
        taskData['subTasks'].forEach(subId => {
            tasksToRemove.push(subId);
        });
    }

    // If it's a subtask, remove its ID from its parent task's subTasks array
    if (taskData['parentTask'] !== undefined) {
        let parentTaskId = taskData['parentTask'];

        let parentTaskData = todoBoxData.tasks.active.find(t => t['taskId'] == parentTaskId) || todoBoxData.tasks.completed.find(t => t['taskId'] == parentTaskId);

        if (parentTaskData && parentTaskData['subTasks']) {
            parentTaskData['subTasks'] = parentTaskData['subTasks'].filter(subId => subId != taskId);
        }
    }

    todoBoxData.tasks.active = todoBoxData.tasks.active.filter(t => !tasksToRemove.includes(t['taskId']));
    todoBoxData.tasks.completed = todoBoxData.tasks.completed.filter(t => !tasksToRemove.includes(t['taskId']));

    localStorage.setItem(listId, JSON.stringify(todoBoxData));

    tasksToRemove.forEach(id => {
        let taskElement = document.getElementById(id);
        taskElement.animate([
            { opacity: 1, height: '79.5px' },
            { opacity: 0, height: '0px' }
        ], {
            duration: 500,
            easing: 'ease-out',
            fill: 'forwards'
        });
        taskElement.onfinish = () => {
            taskElement.remove();
        };

        let iDidTaskElement = document.getElementById(`${id}-${todayStr}`);
        if (iDidTaskElement) {

            iDidTaskElement.animate([
                { opacity: 1, height: '79.5px' },
                { opacity: 0, height: '0px' }
            ], {
                duration: 500,
                easing: 'ease-out',
                fill: 'forwards'
            });
            iDidTaskElement.onfinish = () => {
                iDidTaskElement.remove();
            };
        }
    });

    // ⛰️ Fix the # of completed tasks
    updateHTMLCollapseDiv(listId);

    // If there are no active tasks left, fill in the blank
    if (todoBoxData.tasks.active.length < 1) {
        fillIfBlank(document.getElementById(`todo-box${listId}`).getElementsByClassName('todo-box-tasks')[0]);
    }
}

// HTML code

async function addHTMLTodoBox(listId) {
    const params = { list_id: listId };

    const queryString = new URLSearchParams(params).toString();
    const url = `api/get-tasks?${queryString}`;

    const listData = todoListsData["todo-lists"].find(todoList => todoList.id == listId);

    let box = document.createElement('div');
    box.className = 'todo-box';
    box.id = `todo-box${listId}`;

    let boxTitle = listData.title;

    let refreshingTag = '';
    if (listData.refreshing) {
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
    <div class='todo-box-tasks accordion accordion-flush' id='accordion-flush${listId}'></div>
    <div class='collapse-btn-div d-inline-flex gap-1'></div>
    <div class='collapse todo-box-completed-tasks accordion accordion-flush' id='collapseExample${listId}'>
        <div class="todo-box-completed-refreshing-tasks"></div>
    </div>`;

    let listDiv = document.getElementsByClassName('todo-box-div')[0];
    listDiv.appendChild(box);

    // Add tasks
    const response = await fetch(url);
    let tasksData = await response.json();
    tasksData = tasksData["tasks-data"];

    if (tasksData.filter(task => task.active).length >= 1) {
        (tasksData.filter(task => task.active)).forEach((task) => {
            let taskId = task.id;

            addHTMLTask(listId, taskId, true);
        });
    } else {
        fillIfBlank(box.getElementsByClassName('todo-box-tasks')[0]);
    }

    box.appendChild(document.createElement('br'));

    if (tasksData.filter(task => !task.active).length >= 1) {
        // Add the collapsing div for the completed tasks
        updateHTMLCollapseDiv(listId);
    }
}

async function updateHTMLCollapseDiv(listId) {
    const params = { list_id: listId };

    const queryString = new URLSearchParams(params).toString();
    const url = `api/get-tasks?${queryString}`;
    const response = await fetch(url);
    let tasksData = await response.json();
    tasksData = tasksData["tasks-data"];

    const todoBox = document.getElementById(`todo-box${listId}`);
    todoBox.getElementsByClassName('collapse-btn-div')[0].innerHTML = `
    <button class="btn collapse-btn" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample${listId}" aria-expanded="false" aria-controls="collapseExample${listId}">
        Completed (${tasksData.filter(task => !task.active).length})
    </button>`;
    todoBox.getElementsByClassName('todo-box-completed-tasks')[0].innerHTML = '<div class="todo-box-completed-refreshing-tasks"></div>';

    tasksData.filter(task => !task.active).forEach((task) => {
        let taskId = task.id;

        if (task.completed_for_good) {
            addHTMLCompletedRefreshingTask(listId, taskId);
        } else {
            addHTMLTask(listId, taskId, false);
        }

    });

    // If no completed tasks
    if (tasksData.filter(task => !task.active).length < 1) {
        let completedDiv = todoBox.getElementsByClassName('todo-box-completed-tasks')[0];
        completedDiv.style.display = 'none';
        collapseToggle.style.display = 'none';
    }
}

async function addHTMLTask(listId, taskId, active) {
    const params = { list_id: listId };

    const queryString = new URLSearchParams(params).toString();
    const url = `api/get-tasks?${queryString}`;
    const response = await fetch(url);
    let tasksData = await response.json();
    tasksData = tasksData["tasks-data"];

    let taskData = tasksData.find(task => task.id == taskId);

    // Collect all data; divide and separate according to active and has-parent-already
    const listData = todoListsData["todo-lists"].find(todoList => todoList.id == listId);

    // Enable/disable subtask adding
    let parentTaskId = taskData.parent_task;
    let addSubtask, subtaskClass;
    if (parentTaskId) {
        addSubtask = '';
        subtaskClass = 'subtask';
    } else {
        addSubtask = `
        <li><span class='dropdown-item add-subtask-btn' role="button" tabindex="0">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-return-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5"/>
        </svg>Add a subtask</span>
        </li>`;
        subtaskClass = '';
    }

    // Enable/disable completing a refreshing task
    let completeRefreshingTask = '';
    if (listData.refreshing) {
        completeRefreshingTask = `
        <li><span class='dropdown-item complete-refreshing-task-btn'>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </svg>
        Mark complete</span>
        </li>`;
    }

    // Locate and build HTML elements
    let taskText = taskData['task'];
    let taskDetails = taskData.details;

    let div = document.getElementById(`todo-box${listId}`).querySelector(`.todo-box-tasks`);
    const taskElement = document.createElement('div');

    taskElement.className = 'todo-task accordion-item';
    taskElement.id = `${taskId}`;
    taskElement.innerHTML = `
        <div class="accordion-header task-header-container">
            <div class="accordion-button task-head collapsed" data-bs-toggle="collapse" data-bs-target="#details-${taskId}" aria-expanded="false" aria-controls="details-${taskId}">
                <input type='radio'>
                <textarea name='task-textarea' class='todo-task-text'>${taskText}</textarea>
            </div>
            <button type="button" class="btn edit-todo-task-btn" data-bs-toggle="dropdown" aria-expanded="false" data-toggle="dropdown">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                    <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                </svg>
            </button>
            <ul class="task-edit-dropdown dropdown-menu dropdown-menu-end collapsed">
                <li><span class='dropdown-item remove-task-btn' role="button" tabindex="0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                    </svg>Delete</span>
                </li>
                ${addSubtask}
                ${completeRefreshingTask}
            </ul>
        </div>
        <div id="details-${taskId}" class="accordion-collapse collapse" data-bs-parent="#accordion-flush${listId}">
            <div class="form-floating accordion-body" style="padding: 0px;">
                <textarea id='details-${taskId}-textarea' class='form-control todo-task-details' placeholder='Leave the details here'>${taskDetails}</textarea>
                <label for="details-${taskId}-textarea">Details</label>
            </div>
    </div>`;
    taskElement.animate([
        { opacity: 0, height: '0px' },
        { opacity: 1, height: '79.5px' }
    ], {
        duration: 200,
        easing: 'ease-in'
    });

    const hasMatchingParentTask = parentTaskId && (tasksData.some(t => t.id == parentTaskId) && tasksData.some(t => t.id == taskId));

    if (hasMatchingParentTask) {
        taskElement.className = 'todo-task accordion-item subtask';
        let parentTaskElement = document.getElementById(`${parentTaskId}`);
        if (parentTaskElement) parentTaskElement.after(taskElement);
    } else {
        div?.appendChild(taskElement);
    }
}

async function addHTMLCompletedRefreshingTask(listId, taskId) {
    const params = { list_id: listId };

    const queryString = new URLSearchParams(params).toString();
    const url = `api/get-tasks?${queryString}`;
    const response = await fetch(url);
    let tasksData = await response.json();
    tasksData = tasksData["tasks-data"];

    let taskData = tasksData.find(task => task.id == taskId);

    // Locate and build HTML elements
    let taskText = taskData.task;
    let taskDetails = taskData.details;

    let div = document.getElementById(`todo-box${listId}`).getElementsByClassName('todo-box-completed-refreshing-tasks')[0];
    const taskElement = document.createElement('div');

    taskElement.className = 'todo-task accordion-item';
    taskElement.id = `${taskId}`;
    taskElement.innerHTML = `
        <div class="accordion-header task-header-container">
            <div class="accordion-button task-head collapsed" data-bs-toggle="collapse" data-bs-target="#details-${taskId}" aria-expanded="false" aria-controls="details-${taskId}">
                <input type='radio' checked disabled>
                <textarea name='task-textarea' class='todo-completed-task-text' disabled>${taskText}</textarea>
            </div>
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
            </ul>
        </div>
        <div id="details-${taskId}" class="accordion-collapse collapse" data-bs-parent="#accordion-flush${listId}">
            <div class="form-floating accordion-body" style="padding: 0px;">
                <textarea id='details-${taskId}-textarea' class='form-control todo-completed-task-details' placeholder='Leave the details here' disabled>${taskDetails}</textarea>
                <label for="details-${taskId}-textarea">Details</label>
            </div>
    </div>`;

    let parentTaskId = taskData['parentTask'];
    const hasMatchingParentTask = parentTaskId && (tasksData.some(t => t['taskId'] == parentTaskId) && tasksData.some(t => t['taskId'] == taskId));

    if (hasMatchingParentTask) {
        taskElement.className = 'todo-task accordion-item subtask';
        let parentTaskElement = document.getElementById(`${parentTaskId}`);
        if (parentTaskElement) parentTaskElement.after(taskElement);
    } else {
        div?.appendChild(taskElement);
    }
}

// completedDate is in ISO form YYYY-MM-DD
function addHTMLTaskIDid(listId, taskId, completedDate) {

    let todoBoxData = localStorage.getItem(listId);
    todoBoxData = JSON.parse(todoBoxData);

    let allTasks = todoBoxData.tasks['completed'].concat(todoBoxData.tasks['active']);
    let taskData = allTasks.find(task => task['taskId'] == taskId);

    let div = document.getElementById(`i-did-header-${completedDate}`);

    let completedTag;
    if (completedDate == todayStr || completedDate == yesterdayStr) {
        completedTag = `Completed ${ISOToDateString(completedDate)}`;
    }
    else {
        completedTag = `Completed on ${ISOToDateString(completedDate)}`;
    }

    let taskElement = document.createElement('div');
    taskElement.className = `todo-task i-did-todo-task i-did-${completedDate}`;
    taskElement.id = `${taskId}-${completedDate}`;
    taskElement.innerHTML = `
    <div>
        <div class="task-head">
            <input type='radio' checked>
            <textarea name='task-textarea' class='todo-completed-task-text' disabled>${taskData.task}</textarea>
        </div>
        <p class="i-did-completed-tag">${completedTag}</p>
    </div>`;

    div?.appendChild(taskElement);
}

// Small functions
function toSimpleISOString(date) {
    return date.toLocaleDateString('en-CA');
}

function ISOToDateString(ISOString) {
    if (ISOString == todayStr) {
        return 'Today';
    } else if (ISOString == yesterdayStr) {
        return 'Yesterday';
    }

    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let dateParts = ISOString.split('-');

    return `${months[dateParts[1] - 1]} ${dateParts[2]}, ${dateParts[0]}`;
}

function getIdsFromDropdown(dropdownElement) {
    let taskElement = dropdownElement.parentElement.parentElement.parentElement.parentElement;
    let taskId = taskElement.id;

    let parentTodoBox = taskElement.parentElement.parentElement;
    let listId = parentTodoBox.id.replace('todo-box', '');

    if (isNaN(listId)) {
        parentTodoBox = taskElement.parentElement.parentElement.parentElement;
        listId = parentTodoBox.id.replace('todo-box', '');
    }

    return [taskId, listId];
}
