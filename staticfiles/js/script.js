import { lumiStaticImg, lumiJump } from './lumi.js';

// INIT code
let today = new Date();
today.setHours(0, 0, 0, 0);
let yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
let todayStr = toSimpleISOString(today);
let yesterdayStr = toSimpleISOString(yesterday);

let fillTextArray = ['📝 a blank canvas here!\n', "goodness me, look at that! it's time to get going 🏃\n", 'you can do this! — blue 52 🐳\n', 'may the force be with you... ✊\n', 'lettuce commence. 🥬\n', 'go you! go you! 🎉\n']

// Fetch todo list & task data
function getFetch(init) {
    return fetch('api/get-lists/')
        .then(response => response.json())
        .then(async (data) => {
            globalThis.todoListsData = data;
            globalThis.allListIds = todoListsData["todo-lists"].map(todoList => todoList.id);

            const taskEntries = await Promise.all(
                allListIds.map(async (listId) => {
                    const params = { list_id: listId };
                    const queryString = new URLSearchParams(params).toString();
                    const response_task = await fetch(`api/get-tasks?${queryString}`);
                    const json_response_task = await response_task.json();
                    return [listId, json_response_task["tasks-data"]];
                })
            );
            globalThis.tasksData = new Map(taskEntries);

            if (init) {
                console.log("Fully loaded tasksData:", tasksData);

                if (document.readyState !== 'loading') {
                    globalThis.csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
                    initCode();
                } else {
                    document.addEventListener("DOMContentLoaded", initCode);
                    globalThis.csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
                }
            }
        });
}

function initCode() {
    allListIds.forEach(listId => {
        addHTMLTodoBox(listId);
    });

    if (allListIds.length < 1) document.getElementById('todo-screen-filler').style.display = 'block';

    iDidList();
}

getFetch(true);

// LISTENERS code
document.addEventListener("click", async (event) => {
    if (event.target.closest('.add-todo-box-btn')) await addTodoBox();
    if (event.target.closest('.add-task-btn')) await addTask(event.target.closest('.add-task-btn'));
    if (event.target.closest('.rename-todo-box-btn')) await renameTodoBox(event.target.closest('.rename-todo-box-btn'));
    if (event.target.closest('.remove-todo-box-btn')) await removeTodoBox(event.target.closest('.remove-todo-box-btn'));
    if (event.target.closest('.add-subtask-btn')) await addSubtask(event.target.closest('.add-subtask-btn'));
    if (event.target.closest('.remove-task-btn')) await removeTask(event.target.closest('.remove-task-btn'));
    if (event.target.closest('.complete-refreshing-task-btn')) await completeRefreshingTask(event.target.closest('.complete-refreshing-task-btn'));

    const radio = event.target.closest('input[type="radio"]');
    if (radio) await completeTask(radio);

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
    let num_refreshing_tasks_completed = 0;

    let datesArray = []; // Array of Date objects

    for (let i = 0; i < 8; i++) {
        datesArray.push(new Date(current));

        let currentStr = toSimpleISOString(current);

        let iDidDateHeader = document.createElement('div');
        iDidDateHeader.className = 'i-did-date-header';
        iDidDateHeader.id = `i-did-header-${currentStr}`;
        iDidDateHeader.innerHTML = `<h5>${ISOToDateString(currentStr)}</h5><h3></h3>`;

        document.getElementsByClassName('i-did-body')[0].appendChild(iDidDateHeader);

        current.setDate(current.getDate() - 1);
    }

    Array.from(allListIds).forEach(listId => {
        let boxData = todoListsData["todo-lists"].find(list => list.id == listId);

        // If it's a refreshing list, log one week's worth of past completions
        if (boxData.refreshing) {
            datesArray.forEach(date => {
                // Get each task's range of completed dates
                const tasks = tasksData.get(Number(listId));

                if (tasks && tasks.length > 0) {
                    tasks.forEach(task => {
                        let completed_dates = task.completed_dates;
                        for (const range of completed_dates) {
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
                                let taskId = task.id;
                                let completed_date = toSimpleISOString(date);

                                let completedTag = `${completed_date}`;
                                if (completed_date == todayStr) {
                                    completedTag += 'Today';
                                }
                                else if (completed_date == yesterdayStr) {
                                    completedTag += 'Yesterday';
                                }

                                num_refreshing_tasks_completed++;

                                addHTMLTaskIDid(taskId, completed_date);
                            }
                        }
                    });
                }
            });

            num_refreshing_tasks_completed += tasksData.get(Number(listId)).filter(task => !task.active).length;
        }

        // Display all the completions
        const listTasksData = tasksData.get(Number(listId));
        let completedTasks = listTasksData.filter(task => !task.active && !task.completedForGood);
        if (completedTasks && completedTasks.length > 0) {
            completedTasks.forEach(taskData => {
                let taskId = taskData.id;
                let completed_date = taskData.completed_date || todayStr;

                if (!document.getElementById(`i-did-header-${completed_date}`)) {
                    let iDidDateHeader = document.createElement('div');
                    iDidDateHeader.className = 'i-did-date-header';
                    iDidDateHeader.id = `i-did-header-${completed_date}`;
                    iDidDateHeader.innerHTML = `<h5>${ISOToDateString(completed_date)}</h5>`;
                }

                addHTMLTaskIDid(taskId, completed_date);
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

    const refreshingNumberLabel = document.createElement('h5');
    refreshingNumberLabel.className = 'i-did-number';
    refreshingNumberLabel.textContent = `🍀 Refreshing tasks completed: ${num_refreshing_tasks_completed}`;
    document.getElementsByClassName('i-did-body')[0].prepend(refreshingNumberLabel);

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

async function addTodoBox() {
    const refreshingBoxButton = document.getElementById('add-refreshing-box-button');
    const standardBoxButton = document.getElementById('add-standard-box-button');

    let addBoxModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('makeTodoBoxModal'));

    // ✨ Fetching to Django to add a new list
    refreshingBoxButton.onclick = async () => {
        let fillInText = document.querySelector('blank-todo-fill:not( .blank-todo-fill)');
        if (fillInText) {
            fillInText.remove();
        }
        let boxTitle = document.getElementById('name-todo-box').value;
        addBoxModal.hide();

        await fetch("add-list/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ title: boxTitle, refreshing: true })
        })
            .then(response => response.json())
            .then(async (data) => {
                const newBoxId = data.id;

                // Remove the existing zero state filler image
                document.getElementById('todo-screen-filler').style.display = 'none';
                document.getElementById('name-todo-box').value = '';
                await getFetch(false);

                addHTMLTodoBox(newBoxId);
            });
    };

    standardBoxButton.onclick = async () => {
        let fillInText = document.querySelector('blank-todo-fill:not( .blank-todo-fill)');
        if (fillInText) {
            fillInText.remove();
        }
        let boxTitle = document.getElementById('name-todo-box').value;
        addBoxModal.hide();

        await fetch("add-list/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ title: boxTitle, refreshing: false })
        })
            .then(response => response.json())
            .then(async data => {
                const newBoxId = data.id;

                // Remove the existing zero state filler image
                document.getElementById('todo-screen-filler').style.display = 'none';
                document.getElementById('name-todo-box').value = '';
                await getFetch(false);

                addHTMLTodoBox(newBoxId);
            });
    };
}

async function renameTodoBox(button) {
    const parentTodoBox = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let listId = parentTodoBox.id.replace('todo-box', '');

    const todoTitleHeader = parentTodoBox.getElementsByClassName('todo-title')[0];

    const renameModalInput = document.getElementById('modal-rename-input');
    const renameModalButton = document.getElementById('modal-rename-button');

    renameModalInput.value = todoTitleHeader.textContent;

    renameModalButton.onclick = async () => {
        const renamedTitle = renameModalInput.value;

        if (renamedTitle == "" || renamedTitle == null) {
            return;
        }
        else {
            await fetch("rename-list/", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ list_id: listId, new_title: renamedTitle })
            })
                .then(response => response.json())
                .then(async data => {
                    // Remove the existing zero state filler image
                    document.getElementById('todo-screen-filler').style.display = 'none';
                    document.getElementById('name-todo-box').value = '';
                    await getFetch(false);

                    todoTitleHeader.textContent = renamedTitle;

                    let renameModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('exampleModal'));
                    renameModal.hide();
                });
        }
    };
}

async function removeTodoBox(button) {
    const parentTodoBox = button.parentElement.parentElement.parentElement.parentElement.parentElement;
    let listId = parentTodoBox.id.replace('todo-box', '');

    const removeModalButton = document.getElementById('modal-remove-button');

    removeModalButton.onclick = async () => {
        let removeModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('removeTodoBoxModal'));
        removeModal.hide();

        await fetch("remove-list/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ list_id: listId })
        })
            .then(response => response.json())
            .then(data => {
                const todoBoxesDiv = document.getElementsByClassName('todo-box-div')[0];
                todoBoxesDiv.removeChild(parentTodoBox);

                // Update allListIds and add screen filler if needed
                getFetch(false);

                if (allListIds.length < 1) document.getElementById('todo-screen-filler').style.display = 'block';
            });
    };
}

// TO-DO TASK code

async function addTask(button) {
    const todoBox = button.parentElement.parentElement.parentElement;
    const parentTodoBox = todoBox.getElementsByClassName('todo-box-tasks')[0];

    // Remove the fill-in paragraph if needed
    let fillInText = parentTodoBox.getElementsByClassName('blank-todo-fill')[0];
    if (fillInText) {
        fillInText.remove();
    }

    // ✨ Add the new task to storage
    let listId = todoBox.id.replace('todo-box', '');

    await fetch("add-task/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ parent_list_id: listId })
    })
        .then(response => response.json())
        .then(async data => {
            const newId = data.id;

            await getFetch(false);

            // ⛰️ Create a todo-task div and add it
            addHTMLTask(listId, newId);

            document.getElementById(`task_${newId}`).getElementsByClassName('todo-task-text')[0].focus();
        });

}

async function addSubtask(button) {
    let parentTaskId = getIdsFromDropdown(button)[0].replace('task_', '');
    let listId = getIdsFromDropdown(button)[1];

    // Creating a new id for the new task

    await fetch("add-subtask/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ parent_list_id: listId, parent_task_id: parentTaskId })
    })
        .then(response => response.json())
        .then(async data => {
            const newId = data.id;

            await getFetch(false);

            // ⛰️ Create a todo-task div and add it
            addHTMLTask(listId, newId);

            // Focus on the task
            let newSubtaskElement = document.getElementById(`task_${newId}`);
            if (newSubtaskElement) {
                newSubtaskElement.getElementsByClassName('todo-task-text')[0].focus();
            }
        });
}

async function completeTask(radio) {
    const taskElement = radio.closest('.todo-task');
    if (!taskElement) return;

    const taskId = taskElement.id.replace("task_", "");
    const parentTodoBox = radio.closest('.todo-box');
    if (!parentTodoBox) return;

    const listId = Number(parentTodoBox.id.replace('todo-box', ''));

    let listTasksData = tasksData.get(listId);
    if (!listTasksData) return;
    console.log(listTasksData);

    let taskData = listTasksData.find(task => task.id == taskId);
    if (!taskData) return;

    let idsToChange = [taskId];
    const activeBefore = taskData["active"];

    if (activeBefore) {
        lumiJump();
        confetti({ particleCount: 143, spread: 120, startVelocity: 35, origin: { x: 0.1, y: 1 }, disableForReducedMotion: true });
    }

    // If active, mainstream task, all its subtasks should be completed too
    if (activeBefore && taskData['subtasks']?.length > 0) {
        for (let subtaskId of taskData['subtasks']) {
            if (listTasksData.find(t => t.id == subtaskId).active) {
                idsToChange.push(Number(subtaskId));
            }
        }
    }

    try {
        await Promise.all(idsToChange.map(async (id) => {
            const response = await fetch("complete-task/", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ task_id: id })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            return response.json();
        }));
    } catch (taskError) {
        console.log("Loop failed", taskError);
        throw taskError;
    }

    await getFetch(false);

    for (const id of idsToChange) {
        let el = document.getElementById(`task_${id}`);

        if (el) {
            const animation = el.animate([
                { opacity: 1, height: '79.5px' },
                { opacity: 0, height: '0px' }
            ], {
                duration: 100,
                easing: 'ease-out',
                fill: 'forwards'
            });

            await animation.finished;

            addHTMLTask(listId, id);
            el.remove();
        }
    }

    await updateHTMLCollapseDiv(listId, false);
    iDidList();

    let updatedListTasks = tasksData.get(Number(listId));

    // If no active tasks anymore
    if (updatedListTasks.filter(task => task.active).length < 1) {
        fillIfBlank(parentTodoBox.getElementsByClassName('todo-box-tasks')[0]);
    }

    let fillInText = parentTodoBox.getElementsByClassName('blank-todo-fill')[0];
    if (updatedListTasks.filter(task => task.active).length > 0 && fillInText) {
        fillInText.remove();
    }
}

async function completeRefreshingTask(button) {
    // Locate all parent HTML for JSON IDs
    let taskId = getIdsFromDropdown(button)[0];
    let listId = getIdsFromDropdown(button)[1];
    const parentTodoBox = document.getElementById(`todo-box${listId}`);

    // Lumi Animations
    lumiJump();

    // Code from https://www.kirilv.com/canvas-confetti/
    var duration = 15 * 250;
    var animationEnd = Date.now() + duration;
    var defaults = {
        startVelocity: 30, spread: 360, ticks: 60, zIndex: 10, gravity: 0,
        colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
    };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function () {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        var particleCount = 67 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, shapes: ['star'] });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, shapes: ['star'] });
    }, 250);


    const taskData = tasksData.get(Number(listId)).find(task => task.id == taskId);

    // Consolidate all the tasks that should be moved with the selected task
    let idsToChange = [Number(taskId), ...(taskData['subtasks'] ?? [])].flat();

    try {
        await Promise.all(idsToChange.map(async (id) => {
            const response = await fetch("complete-refreshing-task/", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ task_id: id })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            return response.json();
        }));
    } catch (taskError) {
        console.log("Loop failed", taskError);
        throw taskError;
    }

    await getFetch(false);

    await updateHTMLCollapseDiv(listId, false);
    iDidList();

    let updatedListTasks = tasksData.get(Number(listId));

    // If no active tasks anymore
    if (updatedListTasks.filter(task => task.active).length < 1) {
        fillIfBlank(parentTodoBox.getElementsByClassName('todo-box-tasks')[0]);
    }

    let fillInText = parentTodoBox.getElementsByClassName('blank-todo-fill')[0];
    if (updatedListTasks.filter(task => task.active).length > 0 && fillInText) {
        fillInText.remove();
    }

    for (const id of idsToChange) {
        let el = document.getElementById(`task_${id}`);

        if (el) {
            const animation = el.animate([
                { opacity: 1, height: '79.5px' },
                { opacity: 0, height: '0px' }
            ], {
                duration: 100,
                easing: 'ease-out',
                fill: 'forwards'
            });

            await animation.finished;

            addHTMLCompletedRefreshingTask(listId, id);
            el.remove();
        }
    }
}

async function editTask(textbox) {
    const taskElement = textbox.closest('.todo-task');
    if (!taskElement) return;

    const taskId = taskElement.id.replace("task_", "");

    // ✨ Change the task's content in the database
    await fetch("edit-task/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ task_id: taskId, task_contents: textbox.value })
    })
        .then(response => response.json())
        .then(async data => {
            await getFetch(false);
        });
}

async function editTaskDetails(textarea) {
    const taskElement = textarea.closest('.todo-task');
    if (!taskElement) return;

    const taskId = taskElement.id.replace("task_", "");

    // ✨ Change the task's content in the database
    await fetch("edit-details/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ task_id: taskId, task_details: textarea.value })
    })
        .then(response => response.json())
        .then(async data => {
            await getFetch(false);
        });
}

async function removeTask(button) {
    // Locate all parent HTML for JSON IDs
    let taskId = getIdsFromDropdown(button)[0];
    let listId = getIdsFromDropdown(button)[1];

    let listTasksData = tasksData.get(Number(listId));
    let taskData = listTasksData.find(task => task.id == taskId);

    // Consolidate all the tasks that should be moved with the selected task
    let idsToRemove = [taskId];

    // Gather all associated sub-tasks recursively
    if (taskData.subtasks !== undefined && taskData.subtasks.length > 0) {
        taskData.subtasks.forEach(subId => {
            idsToRemove.push(subId);
        });
    }

    // If it's a subtask, remove its ID from its parent task's subTasks array
    if (taskData['parent_task'] !== undefined) {
        let parentTaskId = taskData['parent_task'];

        let parentTaskData = listTasksData.find(task => task.id == parentTaskId);

        if (parentTaskData && parentTaskData.subtasks) {
            parentTaskData.subtasks = parentTaskData.subtasks.filter(subId => subId != taskId);
        }
    }

    idsToRemove.forEach(async (id) => {
        await fetch("remove-task/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ task_id: taskId })
        })
            .then(response => response.json())
            .then(async data => {
                await getFetch(false);
            });
    });

    for (const id of idsToRemove) {
        let el = document.getElementById(`task_${id}`);

        if (el) {
            const animation = el.animate([
                { opacity: 1, height: '79.5px' },
                { opacity: 0, height: '0px' }
            ], {
                duration: 300,
                easing: 'ease-out',
                fill: 'forwards'
            });

            await animation.finished;

            el.remove();
        }

        let iDidTaskElement = document.getElementById(`task_${id}-${todayStr}`);
        if (iDidTaskElement) {
            const animation = iDidTaskElement.animate([
                { opacity: 1, height: '79.5px' },
                { opacity: 0, height: '0px' }
            ], {
                duration: 500,
                easing: 'ease-out',
                fill: 'forwards'
            });

            await animation.finished;
            iDidTaskElement.remove();
        }
    }

    // ⛰️ Fix the # of completed tasks
    updateHTMLCollapseDiv(listId, false);

    // If there are no active tasks left, fill in the blank
    if (tasksData.get(Number(listId)).filter(t => t.active).length < 1) {
        fillIfBlank(document.getElementById(`todo-box${listId}`).getElementsByClassName('todo-box-tasks')[0]);
    }
}

// HTML code

async function addHTMLTodoBox(listId) {

    const listData = todoListsData["todo-lists"].find(todoList => todoList.id == listId);
    const listTasksData = tasksData.get(Number(listId));

    let box = document.createElement('div');
    box.className = 'todo-box';
    box.id = `todo-box${listId}`;

    let boxTitle = listData?.title;

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
    <div class='collapse-btn-div d-inline-flex gap-1'>
        <button class="btn collapse-btn" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample${listId}" aria-expanded="false" aria-controls="collapseExample${listId}">
            Completed (0)
        </button>
    </div>
    <div class='collapse todo-box-completed-tasks accordion accordion-flush' id='collapseExample${listId}'>
        <div class="todo-box-completed-refreshing-tasks"></div>
    </div>`;

    let listDiv = document.getElementsByClassName('todo-box-div')[0];
    listDiv.appendChild(box);

    if (listTasksData.filter(task => task.active).length >= 1) {
        (listTasksData.filter(task => task.active)).forEach((task) => {
            let taskId = task.id;

            addHTMLTask(listId, taskId);
        });
    } else {
        fillIfBlank(box.getElementsByClassName('todo-box-tasks')[0]);
    }

    box.appendChild(document.createElement('br'));

    // Add the collapsing div for the completed tasks
    updateHTMLCollapseDiv(listId, true);
}

async function updateHTMLCollapseDiv(listId, addTasksBool) {
    const listTasksData = tasksData.get(Number(listId));

    const todoBox = document.getElementById(`todo-box${listId}`);
    const toggleBtn = todoBox.getElementsByClassName('collapse-btn-div')[0].getElementsByClassName('btn')[0];
    toggleBtn.innerHTML = `Completed (${listTasksData.filter(task => !task.active).length})`;

    if (addTasksBool) {
        listTasksData.filter(task => !task.active).forEach((task) => {
            let taskId = task.id;

            if (task.completed_for_good) {
                addHTMLCompletedRefreshingTask(listId, taskId);
            } else {
                addHTMLTask(listId, taskId);
            }

        });
    }

    // If no completed tasks
    if (listTasksData.filter(task => !task.active).length < 1) {
        let collapseToggle = todoBox.getElementsByClassName('collapse-btn-div')[0];
        collapseToggle.style.setProperty("display", "none", "important");
    } else {
        let collapseToggle = todoBox.getElementsByClassName('collapse-btn-div')[0];
        collapseToggle.style.setProperty("display", "inline-flex", "important");
    }
}

async function addHTMLTask(listId, taskId) {
    // Collect all data; divide and separate according to active and has-parent-already
    const listData = todoListsData["todo-lists"].find(todoList => todoList.id == listId);
    const listTasksData = tasksData.get(Number(listId));
    let taskData = listTasksData.find(task => task.id == taskId);

    // Set apart active/completed task
    let completed = !taskData['active'];

    // Enable/disable subtask adding
    let parentTaskId = taskData["parent_task"] || null;
    let addSubtask = parentTaskId ? '' : `
        <li><span class='dropdown-item add-subtask-btn' role="button" tabindex="0">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-return-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5"/>
        </svg>Add a subtask</span>
        </li>`;

    // Enable/disable completing a refreshing task
    let completeRefreshingTask = listData.refreshing ? `
        <li><span class='dropdown-item complete-refreshing-task-btn'>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </svg>
        Mark complete</span>
        </li>` : '';

    // Locate and build HTML elements
    let taskText = taskData['task'];
    let taskDetails = taskData.details;

    const taskElement = document.createElement('div');
    taskElement.className = 'todo-task accordion-item';
    taskElement.id = `task_${taskId}`;
    taskElement.innerHTML = `
        <div class="accordion-header task-header-container">
            <div class="accordion-button task-head collapsed" data-bs-toggle="collapse" data-bs-target="#details-${taskId}" aria-expanded="false" aria-controls="details-${taskId}">
                <input type='radio' ${completed ? 'checked' : ''}>
                <textarea name='task-textarea' class='todo-task-text ${completed ? 'todo-completed-task-text' : ''}' ${completed ? 'disabled' : ''}>${taskText}</textarea>
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
                <textarea id='details-${taskId}-textarea' class='form-control todo-task-details' placeholder='Leave the details here' ${completed ? 'disabled' : ''}>${taskDetails}</textarea>
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

    const hasMatchingParentTask = parentTaskId && (listTasksData.find(task => task.id == parentTaskId).active === taskData.active);

    if (hasMatchingParentTask) {
        taskElement.className = 'todo-task accordion-item subtask';
        let parentTaskElement = document.getElementById(`task_${parentTaskId}`);
        if (parentTaskElement) parentTaskElement.after(taskElement);
    } else {
        let div;
        if (completed) {
            div = document.getElementById(`todo-box${listId}`).getElementsByClassName('todo-box-completed-tasks')[0];
            div.prepend(taskElement);
        } else {
            div = document.getElementById(`todo-box${listId}`).getElementsByClassName(`todo-box-tasks`)[0];
            div?.appendChild(taskElement);
        }
    }
}

async function addHTMLCompletedRefreshingTask(listId, taskId) {

    const listTasksData = tasksData.get(Number(listId));
    let taskData = listTasksData.find(task => task.id == taskId);

    // Locate and build HTML elements
    let taskText = taskData.task;
    let taskDetails = taskData.details;

    let div = document.getElementById(`todo-box${listId}`).getElementsByClassName('todo-box-completed-refreshing-tasks')[0];
    const taskElement = document.createElement('div');

    taskElement.className = 'todo-task accordion-item';
    taskElement.id = `task_${taskId}`;
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

    let parentTaskId = taskData['parent_task'] || null;
    const hasMatchingParentTask = parentTaskId && (listTasksData.some(t => t.id == parentTaskId) && listTasksData.some(t => t.id == taskId));

    if (hasMatchingParentTask) {
        taskElement.className = 'todo-task accordion-item subtask';
        let parentTaskElement = document.getElementById(`task_${parentTaskId}`);
        if (parentTaskElement) parentTaskElement.after(taskElement);
    } else {
        div?.appendChild(taskElement);
    }
}

// completed_date is in ISO form YYYY-MM-DD
function addHTMLTaskIDid(taskId, completed_date) {

    const totalTasksData = [...globalThis.tasksData.values()].flat();
    let taskData = totalTasksData.find(task => task.id == taskId);

    let div = document.getElementById(`i-did-header-${completed_date}`);

    let completedTag;
    if (completed_date == todayStr || completed_date == yesterdayStr) {
        completedTag = `Completed ${ISOToDateString(completed_date)}`;
    }
    else {
        completedTag = `Completed on ${ISOToDateString(completed_date)}`;
    }

    let taskElement = document.createElement('div');
    taskElement.className = `todo-task i-did-todo-task i-did-${completed_date}`;
    taskElement.id = `task_${taskId}-${completed_date}`;
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
    let taskElement = dropdownElement.closest('.todo-task');
    if (!taskElement) return;
    let taskId = taskElement.id.replace("task_", "");

    let parentTodoBox = dropdownElement.closest('.todo-box');
    if (!parentTodoBox) return;
    let listId = parentTodoBox.id.replace('todo-box', '');

    return [taskId, listId];
}
