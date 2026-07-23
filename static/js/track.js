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
        let defaultTodoBoxId = allTodoBoxIds[0];
        selectTodoList(defaultTodoBoxId);

        let defaultTodoBox = JSON.parse(localStorage[`${defaultTodoBoxId}`]);

        if ((defaultTodoBox.tasks.active.length + defaultTodoBox.tasks.completed.length) > 0) {

            newCanvas();

            let taskData = defaultTodoBox.tasks.completed.at(0);

            if (!taskData) {
                taskData = defaultTodoBox.tasks.active.at(0);
            }

            let taskId = Object.keys(taskData)[0];

            selectTask(defaultTodoBoxId, taskId);
        }
    }

    // Fill-in text

});

function selectTask(boxId, taskId) {
    let todoBoxData = JSON.parse(localStorage[`${boxId}`]);

    let taskData = todoBoxData.tasks.active.find(task => taskId in task);

    if (!taskData) {
        taskData = todoBoxData.tasks.completed.find(task => taskId in task);
    }

    taskData = Object.values(taskData)[0];

    let trackRangeDiv = document.querySelector('#track-range-btn-div');

    let oldRangeBtns = document.querySelector('.track-range-btn-group');
    if (oldRangeBtns) {
        trackRangeDiv.removeChild(oldRangeBtns);
    }
    
    chartTask(taskData, "max");

    // Range buttons
    let completedDates = taskData.completedDates;
    const diff = (new Date() - new Date(completedDates[0][0])) / (1000 * 60 * 60 * 24);

    let rangeDiv = document.createElement('div');
    rangeDiv.className = 'track-range-btn-group btn-group';
    rangeDiv.style.marginTop = "3%";
    rangeDiv.role = 'group';
    rangeDiv.ariaLabel = 'Vertical radio toggle button group';
    rangeDiv.innerHTML = `
    <input type="radio" class="btn-check week-range-btn" name="vbtn-radio" id="vbtn-radio1" autocomplete="off" disabled>
    <label class="btn btn-outline-primary" for="vbtn-radio1">Week</label>
    <input type="radio" class="btn-check month-range-btn" name="vbtn-radio" id="vbtn-radio2" autocomplete="off" disabled>
    <label class="btn btn-outline-primary" for="vbtn-radio2">Month</label>
    <input type="radio" class="btn-check 6-months-range-btn" name="vbtn-radio" id="vbtn-radio3" autocomplete="off" disabled>
    <label class="btn btn-outline-primary" for="vbtn-radio3">6 Months</label>
    <input type="radio" class="btn-check 6-months-range-btn" name="vbtn-radio" id="vbtn-radio4" autocomplete="off" disabled>
    <label class="btn btn-outline-primary year-range-btn" for="vbtn-radio4">Year</label>
    <input type="radio" class="btn-check max-range-btn" name="vbtn-radio" id="vbtn-radio5" autocomplete="off" checked>
    <label class="btn btn-outline-primary" for="vbtn-radio5">Max</label>`;

    trackRangeDiv.appendChild(rangeDiv);

    if (diff >= 7) {
        let weekButton = document.querySelector('.week-range-btn');
        weekButton.onclick = () => {
            chartTask(taskData, "week");
        };
        weekButton.disabled = false;

        if (diff >= 28) {
            let monthButton = document.querySelector('.month-range-btn');
            monthButton.onclick = () => {
                chartTask(taskData, "month");
            };
            monthButton.disabled = false;

            if (diff >= 182) {
                let sixMonthButton = document.querySelector('.6-months-range-btn');
                sixMonthButton.onclick = () => {
                    chartTask(taskData, "6months");
                };
                sixMonthButton.disabled = false;

                if (diff >= 364) {
                    let yearButton = document.querySelector('.year-range-btn');
                    yearButton.onclick = () => {
                        chartTask(taskData, "year");
                    };
                    yearButton.disabled = false;
                }
            }
        }
    }

    let maxButton = document.querySelector('.max-range-btn');
    maxButton.onclick = () => {
        chartTask(taskData, "max");
    };
}

function chartTask(taskData, rangeSetting) {
    let completedDates = taskData.completedDates;
    newCanvas();

    let today = new Date();
    let startDate = new Date(today);

    if (rangeSetting == "week") {
        startDate.setDate(startDate.getDate() - 7);
    }
    else if (rangeSetting == "month") {
        startDate.setDate(startDate.getDate() - 28);
    }
    else if (rangeSetting == "6months") {
        startDate.setDate(startDate.getDate() - 182);
    }
    else if (rangeSetting == "year") {
        startDate.setDate(startDate.getDate() - 364);
    }
    else if (rangeSetting == "max") {
        startDate = new Date(completedDates[0][0]);
    }

    // Fill in dlwlrma with dates between completedDates's ranges
    let dlwlrma = [];
    completedDates.forEach(dateRange => {
        let iDate = new Date(dateRange[0]);
        let jDate = dateRange[1];

        if (jDate === null) {
            jDate = new Date(today);
            jDate.setDate(jDate.getDate() - 1);
        }
        else {
            jDate = new Date(jDate);
        }

        while (iDate <= jDate) {
            dlwlrma.push(iDate.toDateString());
            iDate.setDate(iDate.getDate() + 1);
        }
    });

    let iDate = new Date(startDate);
    let selectDate;

    let xValues = [];
    let yValues = [];

    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Record if the task was completed or not
    while (iDate < yesterday) {
        selectDate = iDate.toDateString();
        xValues.push(selectDate);

        if (dlwlrma.includes(selectDate)) {
            yValues.push(1);
        }
        else {
            yValues.push(0);
        }

        iDate.setDate(iDate.getDate() + 1);
    }

    let labeledDates = completedDates.flat();
    labeledDates.push(yesterday.toDateString());
    labeledDates.push(startDate.toDateString());

    // Chart of 0s and 1s, did/did not do
    requestAnimationFrame(() => {
        let taskChart = new Chart("task-content", {
            type: "line",
            data: {
                labels: xValues,
                datasets: [{
                    backgroundColor: "#0d6efd87",
                    borderColor: "rgba(110, 154, 225, 0.2)",
                    data: yValues
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `Completion Track: ${taskData.task} ${rangeSetting}`,
                        padding: {
                            top: 10,
                            bottom: 30
                        },
                        font: {
                            size: 17
                        }
                    },
                    legend: { display: false },
                },
                scales: {
                    x: {
                        ticks: {
                            minRotation: 32.8,
                            callback: function (val, index, ticks) {
                                const label = this.getLabelForValue(val);

                                return labeledDates.includes(label) ? label : null;
                            }
                        }
                    },
                    y: {
                        min: -0.01,
                        max: 1.61803398875,
                    },
                }
            }
        });
    });
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

function newCanvas() {
    let oldCanvas = document.querySelector('#task-content');
    if (oldCanvas) {
        const existingChart = Chart.getChart('#task-content');
        if (existingChart) {
            existingChart.destroy();
        }
        oldCanvas.remove()
    }

    let newCanvas = document.createElement('canvas');
    newCanvas.id = 'task-content';
    newCanvas.style.height = "auto";
    newCanvas.style.width = "auto";

    let trackChartDiv = document.querySelector('#track-chart-div');
    trackChartDiv.appendChild(newCanvas);
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