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

fetch('/api/get-refreshing-lists/')
    .then(response => response.json())
    .then(async (data) => {
        globalThis.allTodoBoxes = data;
        globalThis.allListIds = allTodoBoxes["todo-lists"].map(todoList => todoList.id);

        const taskEntries = await Promise.all(
            allListIds.map(async (listId) => {
                const params = { list_id: listId };
                const queryString = new URLSearchParams(params).toString();
                const response_task = await fetch(`/api/get-tasks?${queryString}`);
                const json_response_task = await response_task.json();
                return [json_response_task["tasks-data"]];
            })
        );
        globalThis.tasksData = [...taskEntries].flat()[0];
        console.log(tasksData);

        // COMPLETION DATA. date: array of completed tasks (names) 
        globalThis.completionData = {};

        tasksData.forEach(taskData => {
            let completedRanges = taskData['completed_dates'];
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
                        iDate = toSimpleISOString(iDate);
                        if (Object.keys(completionData).includes(iDate)) {
                            completionData[iDate].push(taskData.task);
                        } else {
                            completionData[iDate] = [taskData.task];
                        }

                        completedDates.push(iDate);

                        iDate = newDateFromISO(iDate);
                        iDate.setDate(iDate.getDate() + 1);
                    }
                });
            }
        });
        console.log(completionData);

        // STREAK DATA. task: arrays of ranges
        globalThis.streakData = {};

        tasksData.forEach(taskData => {
            let completedRanges = taskData['completed_dates'];

            streakData[taskData.task] = completedRanges;
        });
        console.log(streakData);

        // DATE SETTINGS
        globalThis.dateRanges = Object.values(streakData);
        globalThis.startDates = dateRanges.flatMap((task) => {
            return task.map(range => {
                return (range === undefined || range[1] === null) ? todayStr : range[0];
            });
        });

        let timestamps = startDates.map(date => new Date(date).getTime()).filter(time => !isNaN(time) && time > 0);

        globalThis.startDate = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : new Date();
        startDate = toSimpleISOString(startDate);

        if (document.readyState !== 'loading') {
            initCode();
        } else {
            document.addEventListener("DOMContentLoaded", initCode);
        }

    });

function initCode() {
    if (dateRanges?.length < 1) {
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
}

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
        heatmapSquare.innerHTML = `<rect width="20" height="21" rx="3" ry="3" fill="${squareColor}cc" />`;

        heatmapSquare.classList.add('heatmap-tile');
        heatmapSquare.dataset.bsToggle = 'tooltip';
        heatmapSquare.dataset.bsHtml = 'true';
        heatmapSquare.dataset.bsPlacement = 'right';
        heatmapSquare.dataset.bsTitle = `${weekday.toDateString()} • ${yValue} tasks`;

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

    // Initialize all tooltips on the page
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

}

function longestStreak() {
    let maxStreak = 0;
    let maxStreakTask = 'No streak yet... 🪻';

    tasksData.forEach(taskData => {
        let completedRanges = taskData["completed_dates"];

        completedRanges.forEach(range => {
            let rangeEndDate = range[1] === null ? todayStr : range[1];
            let rangeStartDate = range[0];

            let streak = Math.floor(newDateFromISO(rangeEndDate) - newDateFromISO(rangeStartDate)) / (1000 * 60 * 60 * 24) + 1;

            if (streak > maxStreak) {
                maxStreak = streak;
                maxStreakTask = `${taskData.task}<br>${ISOToDateString(rangeStartDate)} ~ ${ISOToDateString(rangeEndDate)}`;
            }
        });
    });

    document.getElementById('longest-streak-num').textContent = maxStreak;
    document.getElementById('longest-streak-task').innerHTML = maxStreakTask;
}

function longestActiveStreak() {
    let maxStreak = 0;
    let maxStreakTasks = [];
    let rangeStartDate;

    tasksData.forEach(taskData => {
        let completedRanges = taskData["completed_dates"];

        completedRanges.forEach(range => {
            let rangeEndDate = range[1] === null ? todayStr : range[1];
            if (rangeEndDate == todayStr) {
                rangeStartDate = range[0];

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
            maxStreakText += `${taskName}<br> ${ISOToDateString(rangeStartDate)} ~ today`;
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

