let taskChartInstance = null;
let rangeSetting, chartType;

const borderWidth = 3;
const backgroundColor = 'rgba(117, 71, 225, 0.11)';
const pointBorderWidth = 1;
const chartColors = [
    '#c8b4e7',
    '#a88fdc',
    '#8f6fbb',
    '#745aaa',
    '#5a3d8a',
    '#4b2e75',
    '#3d1e5a',
    '#2f0f43',
    '#1f0a30'
];

document.addEventListener('DOMContentLoaded', () => {
    // Activate sidebar link
    // document.querySelector('#sidebar-track-link').className = 'nav-link active';

    const allTodoBoxes = Object.entries(localStorage).filter(([key, value]) => {
        if (!Number.isInteger(+key) || !value) return false;
        try {
            return JSON.parse(value).refreshing;
        } catch (e) {
            return false;
        }
    });
    // const allTodoBoxIds = Object.keys(localStorage).filter((entry) => Number.isInteger(+entry[0]) && JSON.parse(entry[1]).refreshing);

    let allTasks = [];
    allTodoBoxes.forEach(todoData => {
        let todoBox = JSON.parse(todoData[1]);
        allTasks = allTasks.concat(todoBox.tasks.active).concat(todoBox.tasks.completed);
    });

    chartCompletion(allTasks);
});

function chartCompletion(allTasks) {
    let today = new Date();
    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let completionData = {};

    allTasks.forEach(taskData => {
        let completedRanges = taskData.completedDates;
        let completedDates = [];

        // Get the full array of completed dates
        if (completedRanges && completedRanges[0]) {
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
                    completedDates.push(iDate.toISOString().split('T')[0]);
                    iDate.setDate(iDate.getDate() + 1);
                }
            });
        }

        completedDates.forEach(completedDate => {
            if (Object.keys(completionData).includes(completedDate)) {
                completionData[completedDate]++;
            } else {
                completionData[completedDate] = 1;
            }
        });
    });

    let xValues = Object.keys(completionData);
    let yValues = [];

    // Fill in xValues with dates with no completions
    let iDate = new Date(xValues[0]);
    while (iDate <= yesterday) {
        selectDate = iDate.toISOString().split('T')[0];

        if (!xValues.includes(selectDate)) {
            xValues.push(selectDate);
        }

        iDate.setDate(iDate.getDate() + 1);
    }

    xValues = xValues.sort();

    let labels = [];

    // Fill in yValues and labels
    xValues.forEach(date => {
        if (completionData[date]) {
            yValues.push(completionData[date]);
        } else {
            yValues.push(0);
        }

        let labelDate = new Date(date);
        labelDate = labelDate.toDateString().split(" ");
        labelDate = `${labelDate[1]} ${labelDate[2]}`;
        labels.push(labelDate);
    });

    taskChartInstance = new Chart('days-completion-canvas', {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: yValues,
                borderColor: chartColors,
                borderWidth: borderWidth,
                tension: 0.4,
                pointBorderWidth: pointBorderWidth,
                fill: true,
                backgroundColor: backgroundColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
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
                        maxRotation: 0
                    }
                },
                y: {
                    min: 0,
                    ticks: {
                        stepSize: 1
                    }
                },
            }
        }
    });
}

/* function selectTodoList(boxId) {
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

    let dropdownTriggers = [];

    allTasks.forEach(taskData => {
        let subtasks = taskData['subTasks'];
        if (subtasks) {
            let taskId = taskData['taskId'];
            const cleanId = taskId.replace('task_', '');

            let taskElement = document.createElement('input');
            taskElement.type = 'radio';
            taskElement.name = 'rad';
            taskElement.className = 'btn-check';
            taskElement.id = `task-select${cleanId}`;
            taskElement.autocomplete = 'off';
            taskElement.onclick = () => selectTask(boxId, taskId);
            taskNav.appendChild(taskElement);

            if (subtasks && subtasks.length > 0) {
                const btnGroupWrapper = document.createElement('div');
                btnGroupWrapper.classList.add('dropdown', 'd-inline-block');

                let taskLabel = document.createElement('button');
                taskLabel.className = 'btn btn-outline-purple dropdown-toggle';
                taskLabel.type = 'button';
                taskLabel.textContent = `${taskData['task']}`;
                taskLabel.setAttribute('aria-expanded', 'false');
                taskLabel.onclick = (event) => {
                    selectTask(boxId, taskId);
                    event.preventDefault();
                    event.stopPropagation();
                };

                let subtaskDropdown = document.createElement('ul');
                subtaskDropdown.className = 'dropdown-menu';

                subtasks.forEach(subtaskId => {
                    let subtaskData = allTasks.find(t => t['taskId'] == subtaskId);
                    let subtaskCleanId = subtaskId.replace('task_', '');

                    let subtaskElement = document.createElement('li');
                    subtaskElement.innerHTML = `<a class='dropdown-item'>${subtaskData['task']}</a>`;
                    subtaskElement.id = `task-select${subtaskCleanId}`;
                    subtaskElement.onclick = () => selectTask(boxId, subtaskId);
                    subtaskDropdown.appendChild(subtaskElement);
                });

                btnGroupWrapper.appendChild(taskLabel);
                btnGroupWrapper.appendChild(subtaskDropdown);
                taskNav.appendChild(btnGroupWrapper);

                dropdownTriggers.push(taskLabel);
            }
            else {
                let taskLabel = document.createElement('label');
                taskLabel.className = 'btn btn-outline-purple';
                taskLabel.htmlFor = taskElement.id;
                taskLabel.textContent = `${taskData['task']}`;

                taskNav.appendChild(taskLabel);
            }
        }
    });

    taskNavDiv.appendChild(taskNav);

    // Set the subtitle to the list title
    document.querySelector('#title-selected-list').textContent = todoBoxData.title;

    // Initialize the chart display
    if (allTasks.length > 0) {

        let initTaskId = allTasks.at(0)['taskId'];

        selectTask(boxId, initTaskId);
    }
    else {
        whenBlankChart();
    }
} */

/* function selectTask(boxId, taskId) {
    console.log('selected', taskId);

    // Check the task button
    document.querySelector(`#task-select${taskId.replace('task_', '')}`).checked = true;

    // Gather data
    let todoBoxData = JSON.parse(localStorage[`${boxId}`]);

    let taskData = todoBoxData.tasks.active.find(task => taskId == task['taskId']);
    if (!taskData) {
        taskData = todoBoxData.tasks.completed.find(task => taskId == task['taskId']);
    }

    // Update the settings panel
    let chartSettingsDiv = document.querySelector('#chart-settings-div');

    // Range buttons
    let rangeDiv = document.querySelector('.track-range-btn-group');

    // Chart-type buttons
    let chartTypeDiv = document.querySelector('.chart-types-btn-group');

    // Set startDate for range buttons
    let completedRanges = taskData.completedDates;
    let startDate;
    if (completedRanges && completedRanges[0]) {
        startDate = new Date(completedRanges[0][0]);
        document.querySelector('#chart-settings-div').style.opacity = 1;
    }
    else {
        whenBlankChart();
        return;
    }

    // Initalize range buttons
    const diff = (new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24);
    let weekButton = document.querySelector('.week-range-btn');
    if (rangeDiv) {
        weekButton.onclick = () => {
            rangeSetting = 'Week';
            chartBegin(taskData, 'Week', chartType);
        };
        weekButton.disabled = !(diff >= 7);

        let monthButton = document.querySelector('.month-range-btn');
        monthButton.onclick = () => {
            rangeSetting = 'Month';
            chartBegin(taskData, 'Month', chartType);
        };
        monthButton.disabled = !(diff >= 28);

        let sixMonthButton = document.querySelector('.semi-year-range-btn');
        sixMonthButton.onclick = () => {
            rangeSetting = 'Semi-year';
            chartBegin(taskData, 'Semi-year', chartType);
        };
        sixMonthButton.disabled = !(diff >= 182);

        let yearButton = document.querySelector('.year-range-btn');
        yearButton.onclick = () => {
            rangeSetting = 'Year';
            chartBegin(taskData, 'Year', chartType);
        };
        yearButton.disabled = !(diff >= 364);

        let maxButton = document.querySelector('.max-range-btn');
        maxButton.onclick = () => {
            rangeSetting = 'Max';
            chartBegin(taskData, 'Max', chartType);
        };
    }

    // Initialize chart-type buttons
    if (chartTypeDiv) {
        let completeButton = document.querySelector('.chart-complete-btn');
        completeButton.onclick = () => {
            chartType = 'Complete';
            chartBegin(taskData, rangeSetting, chartType);

            weekButton.disabled = !(diff >= 7);
        };
        let streakButton = document.querySelector('.chart-streak-btn');
        streakButton.onclick = () => {
            chartType = 'Streak';
            chartBegin(taskData, rangeSetting, chartType);

            weekButton.disabled = !(diff >= 7);
        };
        let byMonthButton = document.querySelector('.chart-month-btn');
        byMonthButton.onclick = () => {
            chartType = 'Month';

            weekButton.disabled = true;

            chartBegin(taskData, rangeSetting, chartType);
        };
    }

    // Set the parameters for this graph and display
    if (!rangeSetting) {
        rangeSetting = 'Max';
    }
    if (!chartType) {
        chartType = 'Complete';
    }

    if (chartType == 'Month') {
        weekButton.disabled = true;
    }

    chartBegin(taskData, rangeSetting, chartType);
} */

/* function chartBegin(taskData, rangeSetting, chartType) {
    if (rangeSetting == 'Week' && chartType == 'Month') {
        rangeSetting = 'Max';
        document.querySelector('.max-range-btn').checked = true;
    }

    removeFillerText();

    document.querySelector(`.${rangeSetting.toLowerCase()}-range-btn`).checked = true;
    document.querySelector(`.chart-${chartType.toLowerCase()}-btn`).checked = true;

    // Delete any previously existing charts
    if (taskChartInstance !== null) {
        taskChartInstance.destroy();
    }

    let completedRanges = taskData.completedDates;

    let today = new Date();
    let startDate = new Date(today);

    if (rangeSetting == 'Week') {
        startDate.setDate(startDate.getDate() - 7);
    }
    else if (rangeSetting == 'Month') {
        startDate.setDate(startDate.getDate() - 28);
    }
    else if (rangeSetting == 'Semi-year') {
        startDate.setDate(startDate.getDate() - 182);
    }
    else if (rangeSetting == 'Year') {
        startDate.setDate(startDate.getDate() - 364);
    }
    else if (rangeSetting == 'Max') {
        if (completedRanges && completedRanges[0]) {
            startDate = new Date(completedRanges[0][0]);
        }
        else {
            startDate = new Date(taskData.createdDate);
        }
    }

    if (chartType == 'Complete') {
        chartComplete(taskData, startDate, rangeSetting);
    }
    else if (chartType == 'Streak') {
        chartStreak(taskData, startDate, rangeSetting);
    }
    else if (chartType == 'Month') {
        chartMonthly(taskData, startDate, rangeSetting);
    }
} */

/* function chartComplete(taskData, startDate, rangeSetting) {
    let today = new Date();
    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let completedRanges = taskData.completedDates;

    // Fill in completedDates with dates between completedRanges's ranges
    let completedDates = [];
    if (completedRanges && completedRanges[0]) {
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
                completedDates.push(iDate.toISOString().split('T')[0]);
                iDate.setDate(iDate.getDate() + 1);
            }
        });
    }

    let iDate = new Date(startDate);
    let selectDate;

    let xValues = [];
    let yValues = [];

    // Record if the task was completed or not
    while (iDate <= yesterday) {
        selectDate = iDate.toISOString().split('T')[0];
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
    labeledDates.push(yesterday.toISOString().split('T')[0]);
    labeledDates.push(startDate.toISOString().split('T')[0]);

    // Chart of 0s and 1s, did/did not do
    taskChartInstance = new Chart('task-content', {
        type: 'line',
        data: {
            labels: xValues,
            datasets: [{
                data: yValues,
                borderColor: chartColors,
                borderWidth: borderWidth,
                pointBorderWidth: pointBorderWidth,
                fill: true,
                backgroundColor: backgroundColor
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `Completion Track: [${taskData.task}] ${rangeSetting}`,
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
                    min: 0,
                    max: 1.61803398875,
                    ticks: {
                        stepSize: 1
                    }
                },
            }
        }
    });
} */

/* function chartStreak(taskData, startDate, rangeSetting) {
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
            completedDates[`${streakStart.toISOString().split('T')[0]}`] = streakCount;
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
        selectDate = iDate.toISOString().split('T')[0];
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
    labeledDates.push(yesterday.toISOString().split('T')[0]);
    labeledDates.push(startDate.toISOString().split('T')[0]);

    // Chart of streaks
    taskChartInstance = new Chart('task-content', {
        type: 'line',
        data: {
            labels: xValues,
            datasets: [{
                data: yValues,
                borderColor: chartColors,
                borderWidth: borderWidth,
                pointBorderWidth: pointBorderWidth,
                fill: true,
                backgroundColor: backgroundColor
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `Streak Track: [${taskData.task}] ${rangeSetting}`,
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
                    min: 0,
                    ticks: {
                        stepSize: 1
                    }
                },
            }
        }
    });
} */

/* function chartMonthly(taskData, startDate, rangeSetting) {
    startDate = new Date(startDate);

    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    const today = new Date(date.getTime() - offset).toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // An array of all the months between startDate and yesterday
    // so we go from startDate month to yesterday's month

    let monthlyArray = [];

    let A = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    let B = new Date(yesterday.getFullYear(), yesterday.getMonth(), 1)

    while (A <= B) {
        iStr = A.toISOString().split("T")[0];
        iMonth = iStr.split("-")[0] + "-" + iStr.split("-")[1];

        monthlyArray.push(iMonth);

        A.setMonth(A.getMonth() + 1);
    }

    let completedRanges = taskData.completedDates;

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
            completedDates.push(iDate.toISOString().split('T')[0]);
            iDate.setDate(iDate.getDate() + 1);
        }
    });

    let xValues = [];
    let yValues = [];

    // Record how many times the task was completed every month
    monthlyArray.forEach(month => {
        let nextMonth = new Date(month);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        let monthCount = 0;

        for (let date of completedDates) {
            if (date.includes(month)) {
                monthCount++;
            }
            date = new Date(date);
            if (date > nextMonth) {
                break;
            }
        }

        xValues.push(month);
        yValues.push(monthCount);
    });

    // Arrange labeledDates
    let labeledDates = monthlyArray.flat();

    let yesterdayString = yesterday.toISOString().split('T')[0];
    let yesterdayMonthString = yesterdayString.split("-")[0] + "-" + yesterdayString.split("-")[1];
    labeledDates.push(yesterdayMonthString);

    let startDateString = startDate.toISOString().split('T')[0];
    let startMonthString = startDateString.split("-")[0] + "-" + startDateString.split("-")[1];
    labeledDates.push(startMonthString);

    // Bar chart of each month
    taskChartInstance = new Chart('task-content', {
        type: 'bar',
        data: {
            labels: xValues,
            datasets: [{
                data: yValues,
                backgroundColor: [
                    'rgba(200, 180, 231, 0.25)',
                    'rgba(168, 143, 220, 0.25)',
                    'rgba(143, 111, 187, 0.25)',
                    'rgba(116, 90, 170, 0.25)',
                    'rgba(90, 61, 138, 0.25)',
                    'rgba(75, 46, 117, 0.25)',
                    'rgba(61, 30, 90, 0.25)',
                    'rgba(47, 15, 67, 0.25)',
                    'rgba(31, 10, 48, 0.25)'
                ],
                borderColor: chartColors,
                borderWidth: borderWidth
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `Monthly Track: [${taskData.task}] ${rangeSetting}`,
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
                    max: 31
                }
            }
        }
    });
} */

function whenBlankChart() {
    if (taskChartInstance !== null) {
        taskChartInstance.destroy();
    }

    removeFillerText();

    let fillText = document.createElement('p');
    fillText.id = `chart-fill-p`;
    fillText.textContent = `No data yet... it's time to get cracking! 🔮`;

    document.querySelector('#track-dashboard').prepend(fillText);

    document.querySelector('#chart-settings-div').style.opacity = 0;
}

function removeFillerText() {
    let chartFillText = document.querySelector('#chart-fill-p');
    if (chartFillText) {
        chartFillText.remove();
    }
}