document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#navbar-track-link').className = 'nav-link active';

    const allTodoBoxes = Object.entries(localStorage).filter((entry) => Number.isInteger(+entry[0]) && JSON.parse(entry[1]).refreshing);
    const allTodoBoxIds = allTodoBoxes.map(data => data[0]);

    const boxListSidebar = document.querySelector('#todo-lists-sidebar');

    allTodoBoxIds.forEach(boxId => {
        let todoBoxData = JSON.parse(localStorage[`${boxId}`]);
        
        let a = document.createElement('a');
        a.className = '';
        a.id = `sidebar-box${boxId}`;
        a.innerText = todoBoxData.title;

        a.addEventListener('click', () => {
            selectTodoList(boxId);
        });

        boxListSidebar.appendChild(a);
    });

    if (allTodoBoxIds.length > 0) {
        selectTodoList(allTodoBoxIds[0]);
    }
});

function selectTask(boxId, taskId) {
    let todoBoxData = JSON.parse(localStorage[`${boxId}`]);

    let taskData = todoBoxData.tasks.active.find(task => taskId in task);

    if (!taskData) {
        taskData = todoBoxData.tasks.completed.find(task => taskId in task);
    }

    taskData = Object.values(taskData)[0];

    let taskContentDiv = document.querySelector('#task-content');
    taskContentDiv.innerHTML = `<p>Completed dates of ${taskData.task}: ${JSON.stringify(taskData.completedDates)}</p>`
}

function selectTodoList(boxId) {
    let taskNav = document.querySelector('#todo-tasks-nav');
    taskNav.innerHTML = '';

    let todoBoxData = JSON.parse(localStorage[`${boxId}`]);

    let allTasks = todoBoxData.tasks;
    allTasks = allTasks.completed.concat(allTasks.active);

    allTasks.forEach(task => {
        let taskElement = document.createElement('li');
        taskElement.className = 'nav-item';
        taskElement.innerHTML = `<a id=task-select${Object.keys(task)[0].replace('task_', '')} class="nav-link" aria-current="page">${Object.values(task)[0].task}</a>`;

        taskElement.onclick = () => {
            selectTask(boxId, Object.keys(task)[0]);
        }
        taskNav.appendChild(taskElement);
    });

    // Make the last task of the list have no right-side border
    document.querySelector(`#task-select${Object.keys(allTasks.at(-1))[0].replace('task_', '')}`).parentElement.style.borderRightWidth = '0px';
    
    // Set the subtitle to the list title
    document.querySelector('#title-selected-list').innerText = todoBoxData.title;
}

function openNav() {
    document.querySelector('#todo-lists-sidebar').style.width = "200px";
    document.body.style.marginLeft = "200px";

    let openBtn = document.querySelector('#sidebar-open-btn');
    openBtn.className = "btn btn-light btn-close";
    openBtn.ariaLabel = "Close";
    openBtn.onclick = closeNav;
}

function closeNav() {
    document.querySelector('#todo-lists-sidebar').style.width = "0px";
    document.body.style.marginLeft = "4px";
    let openBtn = document.querySelector('#sidebar-open-btn');
    openBtn.className = "btn btn-light";
    openBtn.ariaLabel = "";
    openBtn.onclick = openNav;
}