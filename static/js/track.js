let taskChartInstance = null;
let rangeSetting, chartType;

document.addEventListener('DOMContentLoaded', () => {
    // Activate sidebar link
    document.querySelector('#sidebar-track-link').className = 'nav-link active';

    const allTodoBoxes = Object.entries(localStorage).filter((entry) => Number.isInteger(+entry[0]) && JSON.parse(entry[1]).refreshing);
    const allTodoBoxIds = allTodoBoxes.map(data => data[0]);

    const boxListSidebar = document.querySelector('#todo-lists-sidebar');

    allTodoBoxIds.forEach(boxId => {
        let todoBoxData = JSON.parse(localStorage[`${boxId}`]);

        let a = document.createElement('a');
        a.className = '';
        a.id = `sidebar-box${boxId}`;
        a.textContent = todoBoxData.title;

        a.addEventListener('click', () => {
            selectTodoList(boxId);
        });

        boxListSidebar.appendChild(a);
    });

    if (allTodoBoxIds.length > 0) {
        let defaultTodoBoxId = allTodoBoxIds[0];
        selectTodoList(defaultTodoBoxId);
    }
    else {
        whenBlankChart();
    }
});

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
        let taskId = task['taskId'];

        let taskElement = document.createElement('input');
        taskElement.type = 'radio';
        taskElement.className = 'btn-check';
        taskElement.name = 'btnradio';
        taskElement.id = `task-select${taskId.replace('task_', '')}`;
        taskElement.autocomplete = 'off';
        taskElement.onclick = () => {
            selectTask(boxId, taskId);
        };
        taskNav.appendChild(taskElement);

        let taskLabel = document.createElement('label');
        taskLabel.className = 'btn btn-outline-primary';
        taskLabel.htmlFor = taskElement.id;
        taskLabel.textContent = `${task['task']}`;
        taskNav.appendChild(taskLabel);
    });

    taskNavDiv.appendChild(taskNav);

    // Set the subtitle to the list title
    document.querySelector('#title-selected-list').textContent = todoBoxData.title;

    // Initialize the chart display
    if (allTasks.length > 0) {
        let chartFillText = document.querySelector('#chart-fill-p');
        if (chartFillText) {
            chartFillText.remove();
        }

        let initTaskId = allTasks.at(0)['taskId'];

        document.querySelector(`#task-select${initTaskId.replace('task_', '')}`).checked = true;

        selectTask(boxId, initTaskId);
    }
    else {
        whenBlankChart();
    }
}

function selectTask(boxId, taskId) {
    let todoBoxData = JSON.parse(localStorage[`${boxId}`]);

    let taskData = todoBoxData.tasks.active.find(task => taskId == task['taskId']);
    if (!taskData) {
        taskData = todoBoxData.tasks.completed.find(task => taskId == task['taskId']);
    }

    let chartSettingsDiv = document.querySelector('#chart-settings-div');

    // Update the settings panel
    let oldRangeBtns = document.querySelector('.track-range-btn-group');
    if (oldRangeBtns) {
        chartSettingsDiv.removeChild(oldRangeBtns);
    }
    let oldChartTypeBtns = document.querySelector('.chart-types-btn-group');
    if (oldChartTypeBtns) {
        chartSettingsDiv.removeChild(oldChartTypeBtns);
    }

    // Range buttons
    let rangeDiv = document.createElement('div');
    rangeDiv.className = 'track-range-btn-group btn-group';
    rangeDiv.style.marginTop = '3%';
    rangeDiv.role = 'group';
    rangeDiv.ariaLabel = 'Basic radio toggle button group';
    rangeDiv.innerHTML = `
    <input type='radio' class='btn-check week-range-btn' name='range-radio' id='vbtn-radio1' autocomplete='off' disabled>
    <label class='btn btn-outline-primary' for='vbtn-radio1'>Week</label>
    <input type='radio' class='btn-check month-range-btn' name='range-radio' id='vbtn-radio2' autocomplete='off' disabled>
    <label class='btn btn-outline-primary' for='vbtn-radio2'>Month</label>
    <input type='radio' class='btn-check semi-year-range-btn' name='range-radio' id='vbtn-radio3' autocomplete='off' disabled>
    <label class='btn btn-outline-primary' for='vbtn-radio3'>Semi-year</label>
    <input type='radio' class='btn-check year-range-btn' name='range-radio' id='vbtn-radio4' autocomplete='off' disabled>
    <label class='btn btn-outline-primary' for='vbtn-radio4'>Year</label>
    <input type='radio' class='btn-check max-range-btn' name='range-radio' id='vbtn-radio5' autocomplete='off'>
    <label class='btn btn-outline-primary' for='vbtn-radio5'>Max</label>`;
    chartSettingsDiv.appendChild(rangeDiv);

    // Chart-type buttons
    let chartTypeDiv = document.createElement('div');
    chartTypeDiv.className = 'chart-types-btn-group btn-group';
    chartTypeDiv.style.marginTop = '3%';
    chartTypeDiv.style.marginLeft = 'auto';
    chartTypeDiv.role = 'group';
    chartTypeDiv.ariaLabel = 'Basic radio toggle button group';
    chartTypeDiv.innerHTML = `
    <input type='radio' class='btn-check chart-complete-btn' name='type-radio' id='chart-complete1' autocomplete='off'>
    <label class='btn btn-outline-primary' for='chart-complete1'>Completed</label>
    <input type='radio' class='btn-check chart-streak-btn' name='type-radio' id='chart-streak1' autocomplete='off'>
    <label class='btn btn-outline-primary' for='chart-streak1'>Streak</label>
    <input type='radio' class='btn-check chart-month-btn' name='type-radio' id='chart-month1' autocomplete='off'>
    <label class='btn btn-outline-primary' for='chart-month1'>Monthly</label>`;
    chartSettingsDiv.appendChild(chartTypeDiv);

    // Set startDate for range buttons
    let completedRanges = taskData.completedDates;
    let startDate;
    if (completedRanges && completedRanges[0]) {
        startDate = new Date(completedRanges[0][0]);
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
            chartBegin(taskData, rangeSetting, 'Complete');
        };
        let streakButton = document.querySelector('.chart-streak-btn');
        streakButton.onclick = () => {
            chartType = 'Streak';
            chartBegin(taskData, rangeSetting, 'Streak');
        };
        let byMonthButton = document.querySelector('.chart-month-btn');
        byMonthButton.onclick = () => {
            chartType = 'Month';
            chartBegin(taskData, rangeSetting, 'Month');
        };
    }

    // Set the parameters for this graph and display
    if (!rangeSetting) {
        rangeSetting = 'Max';
    }
    if (!chartType) {
        chartType = 'Complete';
    }

    document.querySelector(`.${rangeSetting.toLowerCase()}-range-btn`).checked = true;
    document.querySelector(`.chart-${chartType.toLowerCase()}-btn`).checked = true;

    if (chartType && chartType == 'Month') {
        weekButton.disabled = true;

        if (rangeSetting && rangeSetting == 'Week') {
            let rangeSetting = 'Max';
            document.querySelector('.max-range-btn').checked = true;
        }
    }
    else {
        weekButton.disabled = !(diff >= 7);
    }

    chartBegin(taskData, rangeSetting, chartType);

    chartSettingsDiv.onclick = () => {
        chartBegin(taskData, rangeSetting, chartType);
    };
}

function chartBegin(taskData, rangeSetting, chartType) {

    // Delete any previously existing charts
    if (taskChartInstance !== null) {
        taskChartInstance.destroy();
    }

    // Delete any filler text if needed
    let oldFillText = document.querySelector('#chart-fill-p');
    if (oldFillText) {
        oldFillText.remove();
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
}

function chartComplete(taskData, startDate, rangeSetting) {
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
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                    'rgba(255, 205, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(201, 203, 207, 0.2)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)',
                    'rgb(153, 102, 255)',
                    'rgb(201, 203, 207)'
                ],
                borderWidth: 1
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
                    min: -0.01,
                    max: 1.61803398875,
                },
            }
        }
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
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                    'rgba(255, 205, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(201, 203, 207, 0.2)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)',
                    'rgb(153, 102, 255)',
                    'rgb(201, 203, 207)'
                ],
                borderWidth: 1
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
                    min: 0
                },
            }
        }
    });
}

function chartMonthly(taskData, startDate, rangeSetting) {
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

        console.log(A, iMonth);
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
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(255, 159, 64, 0.2)',
                    'rgba(255, 205, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(201, 203, 207, 0.2)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)',
                    'rgb(153, 102, 255)',
                    'rgb(201, 203, 207)'
                ],
                borderWidth: 1
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
}

function openNav() {
    let sidebarNav = document.querySelector('#todo-lists-sidebar');
    sidebarNav.style.width = '200px';

    let openBtn = document.querySelector('#sidebar-open-btn');
    openBtn.className = 'btn btn-light';
    openBtn.ariaLabel = 'Close';
    openBtn.onclick = closeNav;
}

function closeNav() {
    let sidebarNav = document.querySelector('#todo-lists-sidebar');
    sidebarNav.style.width = '0px';

    let openBtn = document.querySelector('#sidebar-open-btn');
    openBtn.className = 'btn btn-light';
    openBtn.ariaLabel = '';
    openBtn.onclick = openNav;
}

function whenBlankChart() {
    if (taskChartInstance !== null) {
        taskChartInstance.destroy();
    }

    let fillText = document.createElement('p');
    fillText.id = `chart-fill-p`;
    fillText.textContent = `No data yet... it's time to get cracking! 🔮`;

    document.querySelector('#track-chart-div').prepend(fillText);

    document.querySelector('#chart-settings-div').innerHTML = "";
}