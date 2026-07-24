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
    }

    // TODO: Fill-in text

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

    // Initialize it to "Max"
    chartBegin(taskData, "Max");

    // Range buttons
    let completedRanges = taskData.completedDates;

    let rangeDiv = document.createElement('div');
    rangeDiv.className = 'track-range-btn-group btn-group';
    rangeDiv.style.marginTop = "3%";
    rangeDiv.role = 'group';
    rangeDiv.ariaLabel = 'Basic radio toggle button group';
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

    let startDate;
    if (completedRanges[0]) {
        startDate = new Date(completedRanges[0][0]);
    }
    else {
        startDate = new Date(taskData.createdDate);
    }

    const diff = (new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24);
    if (diff >= 7) {
        let weekButton = document.querySelector('.week-range-btn');
        weekButton.onclick = () => {
            chartBegin(taskData, "Week");
        };
        weekButton.disabled = false;

        if (diff >= 28) {
            let monthButton = document.querySelector('.month-range-btn');
            monthButton.onclick = () => {
                chartBegin(taskData, "Month");
            };
            monthButton.disabled = false;

            if (diff >= 182) {
                let sixMonthButton = document.querySelector('.6-months-range-btn');
                sixMonthButton.onclick = () => {
                    chartBegin(taskData, "6 Months");
                };
                sixMonthButton.disabled = false;

                if (diff >= 364) {
                    let yearButton = document.querySelector('.year-range-btn');
                    yearButton.onclick = () => {
                        chartBegin(taskData, "Year");
                    };
                    yearButton.disabled = false;
                }
            }
        }
    }

    let maxButton = document.querySelector('.max-range-btn');
    maxButton.onclick = () => {
        chartBegin(taskData, "Max");
    };
}

function chartBegin(taskData, rangeSetting) {
    newCanvas();

    let completedRanges = taskData.completedDates;

    let today = new Date();
    let startDate = new Date(today);

    if (rangeSetting == "Week") {
        startDate.setDate(startDate.getDate() - 7);
    }
    else if (rangeSetting == "Month") {
        startDate.setDate(startDate.getDate() - 28);
    }
    else if (rangeSetting == "6 Months") {
        startDate.setDate(startDate.getDate() - 182);
    }
    else if (rangeSetting == "Year") {
        startDate.setDate(startDate.getDate() - 364);
    }
    else if (rangeSetting == "Max") {
        if (completedRanges[0]) {
            startDate = new Date(completedRanges[0][0]);
        }
        else {
            startDate = new Date(taskData.createdDate);
        }
    }

    chartStreak(taskData, startDate, rangeSetting);
}

function chartComplete(taskData, startDate, rangeSetting) {
    let today = new Date();
    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let completedRanges = taskData.completedDates;

    console.log(completedRanges);

    // Fill in completedDates with dates between completedRanges's ranges
    let completedDates = [];
    completedRanges.forEach(dateRange => {
        let iDate = new Date(dateRange[0]);
        let jDate = dateRange[1];

        if (jDate === null) {
            jDate = new Date(yesterday);
        }
        else {
            jDate = new Date(jDate);
        }

        while (iDate <= jDate) {
            completedDates.push(iDate.toDateString());
            iDate.setDate(iDate.getDate() + 1);
        }
    });

    let iDate = new Date(startDate);
    let selectDate;

    let xValues = [];
    let yValues = [];

    // Record if the task was completed or not
    while (iDate <= yesterday) {
        selectDate = iDate.toDateString();
        xValues.push(selectDate);

        if (completedDates.includes(selectDate)) {
            yValues.push(1);
        }
        else {
            yValues.push(0);
        }

        iDate.setDate(iDate.getDate() + 1);
    }

    let labeledDates = completedRanges.flat();
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
                            size: 19
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

function chartStreak(taskData, startDate, rangeSetting) {
    let today = new Date();
    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let completedRanges = taskData.completedDates;

    // Fill in completedDates as {'completedDate' : currentStreak}
    let completedDates = {};
    completedRanges.forEach(range => {
        let streakStart = new Date(range[0]);
        let streakEnd = range[1];

        if (streakEnd === null) {
            streakEnd = new Date(yesterday);
        }
        else {
            streakEnd = new Date(streakEnd);
        }

        let streakCount = 1;
        while (streakStart <= streakEnd) {
            completedDates[`${streakStart.toDateString()}`] = streakCount;
            streakStart.setDate(streakStart.getDate() + 1);
            streakCount++;
        }
    });

    let iDate = new Date(startDate);
    let selectDate;

    let xValues = [];
    let yValues = [];

    // Record if the task was completed or not
    while (iDate <= yesterday) {
        selectDate = iDate.toDateString();
        xValues.push(selectDate);

        if (Object.keys(completedDates).includes(selectDate)) {
            yValues.push(completedDates[selectDate]);
        }
        else {
            yValues.push(0);
        }

        iDate.setDate(iDate.getDate() + 1);
    }
    let labeledDates = completedRanges.flat();
    labeledDates.push(yesterday.toDateString());
    labeledDates.push(startDate.toDateString());

    // Chart of streaks
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
                        text: `Streak Track: ${taskData.task} ${rangeSetting}`,
                        padding: {
                            top: 10,
                            bottom: 30
                        },
                        font: {
                            size: 19
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
                        min: 0
                    },
                }
            }
        });
    });
}

function selectTodoList(boxId) {
    let taskNavDiv = document.querySelector('#todo-tasks-nav');

    let todoBoxData = JSON.parse(localStorage[`${boxId}`]);

    let allTasks = todoBoxData.tasks;
    allTasks = allTasks.completed.concat(allTasks.active);

    let oldTaskNav = document.querySelector('.task-nav-btn-group');
    if (oldTaskNav) {
        oldTaskNav.remove();
    }

    let taskNav = document.createElement('div');
    taskNav.className = 'task-nav-btn-group btn-group';
    taskNav.role = 'group';
    taskNav.ariaLabel = 'Basic radio toggle button group';
    taskNav.style.marginLeft = '13px';

    allTasks.forEach(task => {
        let taskElement = document.createElement('input');
        taskElement.type = 'radio';
        taskElement.className = 'btn-check';
        taskElement.name = 'btnradio';
        taskElement.id = `task-select${Object.keys(task)[0].replace('task_', '')}`;
        taskElement.autocomplete = 'off';
        taskElement.onclick = () => {
            selectTask(boxId, Object.keys(task)[0]);
        };
        taskNav.appendChild(taskElement);

        let taskLabel = document.createElement('label');
        taskLabel.className = 'btn btn-outline-primary';
        taskLabel.htmlFor = taskElement.id;
        taskLabel.innerText = `${Object.values(task)[0].task}`;
        taskNav.appendChild(taskLabel);
    });

    taskNavDiv.appendChild(taskNav);

    // Set the subtitle to the list title
    document.querySelector('#title-selected-list').innerText = todoBoxData.title;

    // Initialize the chart display
    if (allTasks.length > 0) {
        let initTaskId = Object.keys(allTasks.at(0))[0];

        document.querySelector(`#task-select${initTaskId.replace('task_', '')}`).checked = true;

        selectTask(boxId, initTaskId);
    }
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