// Initializing chart constants
let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const borderWidth = 4;
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

// Declaring task data globally
let today = new Date();
let todayStr = toSimpleISOString(today);
let yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
let yesterdayStr = toSimpleISOString(yesterday);

const allTodoBoxes = Object.entries(localStorage).filter(([key, value]) => {
    if (!Number.isInteger(+key) || !value) return false;
    try {
        return JSON.parse(value).refreshing;
    } catch (e) {
        return false;
    }
});

let allTasks = [];
allTodoBoxes.forEach(todoData => {
    let todoBox = JSON.parse(todoData[1]);
    allTasks = allTasks.concat(todoBox.tasks.active).concat(todoBox.tasks.completed);
});

// Get data about completion. date: array of completed tasks (names) 
let completionData = {};

allTasks.forEach(taskData => {
    let completedRanges = taskData.completedDates;
    let completedDates = [];

    // Get the full array of completed dates
    if (completedRanges && completedRanges[0]) {
        completedRanges.forEach(dateRange => {
            let iDate = newDateFromISO(dateRange[0]);
            let jDate = dateRange[1];

            if (jDate === null) {
                jDate = new Date(yesterday);
            }
            else {
                jDate = newDateFromISO(jDate);
            }

            while (iDate <= jDate) {
                completedDates.push(toSimpleISOString(iDate));
                iDate.setDate(iDate.getDate() + 1);
            }
        });
    }

    completedDates.forEach(completedDate => {
        if (Object.keys(completionData).includes(completedDate)) {
            completionData[completedDate].push(taskData.task);
        } else {
            completionData[completedDate] = [taskData.task];
        }
    });
});

// Data about streaks. task: arrays of ranges
let streakData = {};

allTasks.forEach(taskData => {
    let completedRanges = taskData.completedDates;

    streakData[taskData.task] = completedRanges;
});

let dateRanges = Object.values(streakData);

let startDates = dateRanges.flatMap((task) => {
    return task.map(range => {
        return (range === undefined || range[1] === null) ? todayStr : range[0];
    });
});

let timestamps = startDates.map(date => new Date(date).getTime()).filter(time => !isNaN(time) && time > 0);

let startDate = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : new Date();
startDate = toSimpleISOString(startDate);


document.addEventListener('DOMContentLoaded', () => {
    // Activate sidebar link
    console.log(dateRanges);
    if (dateRanges.length < 1) {
        let fillers = document.getElementsByClassName('filler-div');
        Array.from(fillers).forEach((filler) => {
            filler.style.display = 'block';
        });
        return;
    } else {
        chartCompletion();
        activityHeatmap();
        streakActivity();
        longestStreak();
        longestActiveStreak();
    }
});

function chartCompletion() {
    let formattedData = [];

    let completedDates = Object.keys(completionData);

    // Fill in the data with dates with no completions
    let iDate = newDateFromISO(completedDates.sort()[0]);
    while (iDate < yesterday) {
        let date = toSimpleISOString(iDate);

        if (completedDates.includes(date)) {
            formattedData.push({ x: date, y: completionData[date].length });
        }
        else {
            formattedData.push({ x: date, y: 0 });
        }

        iDate.setDate(iDate.getDate() + 1);
    }

    let labels = [];

    completedDates.forEach(date => {
        labels.push(ISOToDateString(date, false));
    });

    // Task data
    const data = {
        labels: labels,
        datasets: [{
            data: formattedData,
            fill: true,
            tension: 0.4,

            backgroundColor: backgroundColor,
            borderColor: chartColors[1],
            borderWidth: borderWidth,

            pointBorderWidth: pointBorderWidth,
            radius: 1,
            hoverRadius: 5,
            hitRadius: 15,
        }]
    };
    const scales = {
        x: {
            ticks: {
                color: '#2D264B', font: { weight: 500, size: 12 }, maxRotation: 0
            },
            grid: { display: false },

            type: 'time',
            time: {
                unit: 'day'
            },
            reverse: false,
            min: startDate,
            max: todayStr
        },
        y: {
            min: 0,
            ticks: {
                stepSize: 1
            },
            grid: { color: 'rgba(45, 38, 75, 0.08)' }
        },
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0d0a1ac1',
                padding: 8,
                cornerRadius: 8,
                titleFont: { weight: 'bold', size: 14 },

                usePointStyle: true,
                callbacks: {
                    title: function (context) {
                        return ISOToDateString(context[0].raw.x, true);
                    },
                    label: function (context) {
                        let label = ' ' + context.parsed.y || '';

                        if (label && label == 1) {
                            label += ' task';
                        } else if (label) {
                            label += ' tasks';
                        } else {
                            label = '0 tasks';
                        }

                        completionData[context.raw.x]?.forEach(taskName => {
                            label += `${taskName}\n`;
                        });

                        return label;
                    },
                    labelTextColor: function (context) {
                        return '#ebebff';
                    },
                    labelPointStyle: function (context) {
                        return {
                            pointStyle: 'circle',
                            rotation: 0
                        };
                    }
                }
            }
        },
        scales: scales
    };

    taskChartInstance = new Chart('days-completion-canvas', {
        type: 'line',
        data: data,
        options: options
    });
}

function streakActivity() {

    let taskNames = Object.keys(streakData);

    const formattedRanges = dateRanges.flatMap((ranges, taskIndex) => {
        const taskName = taskNames[taskIndex];

        if (!ranges || ranges.length === 0) return [];

        return ranges.map(range => {
            const startDate = range[0];
            const endDate = range[1] === null ? yesterdayStr : range[1];

            return {
                x: [startDate, endDate],
                y: taskName
            }
        })
    });

    console.log(new Date());

    taskChartInstance = new Chart('streak-timeline-canvas', {
        type: 'bar',
        data: {
            labels: taskNames,
            datasets: [{
                data: formattedRanges,
                minBarLength: 3.5,
                backgroundColor: 'rgba(124, 77, 255, 0.35)',
                borderColor: '#7C43D8',
                borderRadius: 5,
                borderWidth: borderWidth,
                borderSkipped: function (ctx) {
                    if (ctx.raw.x[1] == yesterdayStr) {
                        return 'right';
                    }
                    else {
                        return false;
                    }
                },
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0d0a1ac1',
                    padding: 8,
                    cornerRadius: 8,
                    titleFont: { weight: 'bold', size: 14 },

                    usePointStyle: true,
                    callbacks: {
                        label: function (context) {
                            let currentRange = context.raw.x;

                            return `${ISOToDateString(currentRange[0], true)} ~ ${ISOToDateString(currentRange[1], true)}`;
                        },
                        labelTextColor: function (context) {
                            return '#ebebff';
                        },
                        labelPointStyle: function (context) {
                            return {
                                pointStyle: 'circle',
                                rotation: 0
                            };
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    reverse: false,
                    min: startDate,
                    max: todayStr,
                    stacked: true,
                    ticks: {
                        color: '#2D264B', font: { weight: 500, size: 12 }, maxRotation: 0
                    }
                },
                y: {
                    grid: { color: 'rgba(45, 38, 75, 0.08)' },
                    grid: { display: false }
                },
            }
        }
    });
}

function activityHeatmap() {
    let xValues = Object.keys(completionData);
    let yValues = [];

    // Fill in xValues with dates with no completions
    let iDate = newDateFromISO(xValues.sort()[0]);
    // Find the Monday before/on the first date of completion
    // Source - https://stackoverflow.com/a/46544455
    // Retrieved 2026-08-20, License - CC BY-SA 3.0
    iDate.setDate(iDate.getDate() - (iDate.getDay() + 6) % 7);

    while (iDate < yesterday) {
        selectDate = toSimpleISOString(iDate);

        if (!xValues.includes(selectDate)) {
            xValues.push(selectDate);
        }

        iDate.setDate(iDate.getDate() + 1);
    }

    xValues = xValues.sort();

    let heatmapColors = {
        0: '#EAE3F7',
        1: '#CBB3ED',
        2: '#A37BE6',
        3: '#7C43D8',
        4: '#531CB3'
    }

    // Fill in yValues and labels
    xValues.forEach(date => {
        let yValue = completionData[date] || '';
        yValue = yValue.length;
        yValues.push(yValue);

        // HTML svg heatmap squares
        let weekday = newDateFromISO(date);

        let squareColor;
        if (yValue < 5) {
            squareColor = heatmapColors[yValue];
        } else {
            squareColor = '#320A78';
        }

        let heatmapSquare = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        heatmapSquare.classList.add('heatmap-tile');
        heatmapSquare.dataset.bsToggle = 'tooltip';
        heatmapSquare.dataset.bsHtml = 'true';
        heatmapSquare.dataset.bsPlacement = 'right';
        heatmapSquare.dataset.bsTitle = `${weekday.toDateString()} • ${yValue} tasks`;

        heatmapSquare.innerHTML = `<rect width="20" height="21" rx="3" ry="3" fill="${squareColor}cc" />`;
        document.getElementById(`heatmap-row-${weekday.getDay()}`).appendChild(heatmapSquare);

        if (weekday.getDay() == 1) {
            let weekLabel = document.createElement('span');
            weekLabel.textContent = months[weekday.getMonth()];

            document.getElementById('heatmap-weeks').append(weekLabel);

            if (weekLabel.previousElementSibling && weekLabel.previousElementSibling.textContent == weekLabel.textContent) {
                weekLabel.style.opacity = '0';
            }
        }
    });
}

function longestStreak() {
    let maxStreak = 0;
    let maxStreakTask = 'No streak yet... 🪻';

    allTasks.forEach(taskData => {
        let completedRanges = taskData.completedDates;

        completedRanges.forEach(range => {
            let rangeEndDate = range[1] === null ? todayStr : range[1];
            let rangeStartDate = range[0];

            let streak = Math.floor(newDateFromISO(rangeEndDate) - newDateFromISO(rangeStartDate)) / (1000 * 60 * 60 * 24) + 1;

            if (streak > maxStreak) {
                maxStreak = streak;
                maxStreakTask = taskData.task;
            }
        });
    });

    document.getElementById('longest-streak-num').textContent = maxStreak;
    document.getElementById('longest-streak-task').textContent = maxStreakTask;
}

function longestActiveStreak() {
    let maxStreak = 0;
    let maxStreakTasks = [];

    allTasks.forEach(taskData => {
        let completedRanges = taskData.completedDates;

        completedRanges.forEach(range => {
            let rangeEndDate = range[1] === null ? todayStr : range[1];
            if (rangeEndDate == todayStr) {
                let rangeStartDate = range[0];

                let streak = Math.floor(newDateFromISO(rangeEndDate) - newDateFromISO(rangeStartDate)) / (1000 * 60 * 60 * 24) + 1;

                if (streak > maxStreak) {
                    maxStreak = streak;
                    maxStreakTasks = [taskData.task];
                } else if (streak == maxStreak) {
                    maxStreakTasks.push(taskData.task);
                }
            }
        });
    });

    let maxStreakText = '';
    if (maxStreakTasks.length == 0) {
        maxStreakText = 'No streak now... 🪻';
    } else {
        maxStreakTasks.forEach(taskName => {
            maxStreakText += `${taskName}<br>`;
        });
    }

    document.getElementById('longest-active-streak-num').textContent = maxStreak;
    document.getElementById('longest-active-streak-task').innerHTML = maxStreakText;
}

function whenBlankChart() {
    if (taskChartInstance !== null) {
        taskChartInstance.destroy();
    }

    removeFillerText();

    let fillText = document.createElement('p');
    fillText.id = `chart-fill-p`;
    fillText.textContent = `No data yet... it's time to get cracking! 🔮`;

    document.getElementById('track-dashboard').prepend(fillText);

    document.getElementById('chart-settings-div').style.opacity = 0;
}

function removeFillerText() {
    let chartFillText = document.getElementById('chart-fill-p');
    if (chartFillText) {
        chartFillText.remove();
    }
}

// Small date-formatting functions

function newDateFromISO(dateStr) {
    let dateParts = dateStr.split('-');

    let yearPart = dateParts[0];
    let monthPart = dateParts[1] - 1;
    let dayPart = dateParts[2];

    return new Date(yearPart, monthPart, dayPart);
}

function toSimpleISOString(date) {
    return date.toLocaleDateString('en-CA');
}

// 2026-08-01 to Month Date, YY
function ISOToDateString(ISOString, yearIncluded) {
    let dateParts = ISOString.split('-');

    labelDate = `${months[dateParts[1] - 1]} ${dateParts[2]}`;

    if (yearIncluded) {
        labelDate += `, ${dateParts[0]}`;
    }

    return labelDate;
}


//let taskChartInstance = null;
// let rangeSetting, chartType;

/* function selectTodoList(boxId) {
    let taskNavDiv = document.getElementById('todo-tasks-nav');
 
    let todoBoxData = JSON.parse(localStorage[`${boxId}`]);
 
    let allTasks = todoBoxData.tasks;
    allTasks = allTasks.completed.concat(allTasks.active);
 
    let oldTaskNav = document.getElementsByClassName('task-nav-btn-group');
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
    document.getElementById('title-selected-list').textContent = todoBoxData.title;
 
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
    document.getElementById(`task-select${taskId.replace('task_', '')}`).checked = true;
 
    // Gather data
    let todoBoxData = JSON.parse(localStorage[`${boxId}`]);
 
    let taskData = todoBoxData.tasks.active.find(task => taskId == task['taskId']);
    if (!taskData) {
        taskData = todoBoxData.tasks.completed.find(task => taskId == task['taskId']);
    }
 
    // Update the settings panel
    let chartSettingsDiv = document.getElementById('chart-settings-div');
 
    // Range buttons
    let rangeDiv = document.getElementsByClassName('track-range-btn-group');
 
    // Chart-type buttons
    let chartTypeDiv = document.getElementsByClassName('chart-types-btn-group');
 
    // Set startDate for range buttons
    let completedRanges = taskData.completedDates;
    let startDate;
    if (completedRanges && completedRanges[0]) {
        startDate = new Date(completedRanges[0][0]);
        document.getElementById('chart-settings-div').style.opacity = 1;
    }
    else {
        whenBlankChart();
        return;
    }
 
    // Initalize range buttons
    const diff = (new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24);
    let weekButton = document.getElementsByClassName('week-range-btn');
    if (rangeDiv) {
        weekButton.onclick = () => {
            rangeSetting = 'Week';
            chartBegin(taskData, 'Week', chartType);
        };
        weekButton.disabled = !(diff >= 7);
 
        let monthButton = document.getElementsByClassName('month-range-btn');
        monthButton.onclick = () => {
            rangeSetting = 'Month';
            chartBegin(taskData, 'Month', chartType);
        };
        monthButton.disabled = !(diff >= 28);
 
        let sixMonthButton = document.getElementsByClassName('semi-year-range-btn');
        sixMonthButton.onclick = () => {
            rangeSetting = 'Semi-year';
            chartBegin(taskData, 'Semi-year', chartType);
        };
        sixMonthButton.disabled = !(diff >= 182);
 
        let yearButton = document.getElementsByClassName('year-range-btn');
        yearButton.onclick = () => {
            rangeSetting = 'Year';
            chartBegin(taskData, 'Year', chartType);
        };
        yearButton.disabled = !(diff >= 364);
 
        let maxButton = document.getElementsByClassName('max-range-btn');
        maxButton.onclick = () => {
            rangeSetting = 'Max';
            chartBegin(taskData, 'Max', chartType);
        };
    }
 
    // Initialize chart-type buttons
    if (chartTypeDiv) {
        let completeButton = document.getElementsByClassName('chart-complete-btn');
        completeButton.onclick = () => {
            chartType = 'Complete';
            chartBegin(taskData, rangeSetting, chartType);
 
            weekButton.disabled = !(diff >= 7);
        };
        let streakButton = document.getElementsByClassName('chart-streak-btn');
        streakButton.onclick = () => {
            chartType = 'Streak';
            chartBegin(taskData, rangeSetting, chartType);
 
            weekButton.disabled = !(diff >= 7);
        };
        let byMonthButton = document.getElementsByClassName('chart-month-btn');
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
        document.getElementsByClassName('max-range-btn').checked = true;
    }
 
    removeFillerText();
 
    document.getElementsByClassName(`${rangeSetting.toLowerCase()}-range-btn`).checked = true;
    document.getElementsByClassName(`chart-${chartType.toLowerCase()}-btn`).checked = true;
 
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
