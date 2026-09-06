document.addEventListener('DOMContentLoaded', () => {
    // Refreshing mechanism
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    const today = new Date(date.getTime() - offset).toISOString().split('T')[0]; // Formatting into local-time ISO string

    let lastAccessedDate = localStorage.getItem('lastAccessedDate');

    // REFRESHING LOGIC ☑️
    console.log("New date?", lastAccessedDate != today);

    if (lastAccessedDate == null) {
        let welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal'), {});
        welcomeModal.show();

        localStorage.setItem('lastAccessedDate', today);
    }
    else {
        if (today != lastAccessedDate) {
            let totalTasksNum = 0;
            let totalTasksCompleted = 0;
            let totalListsCompleted = 0;

            // Get all the refreshing to-do boxes
            let todoBoxes = Object.entries(localStorage).filter((entry) => Number.isInteger(+entry[0]));
            let allRefreshingTodoBoxes = [];
            todoBoxes.forEach(boxData => {
                let boxId = boxData[0];
                boxData = JSON.parse(boxData[1]);

                // Gather data from last time for display
                totalTasksNum += boxData.tasks.active.length + boxData.tasks.completed.length;
                totalTasksCompleted += boxData.tasks.completed.filter(t => (t.completedDate && t.completedDate == lastAccessedDate)).length;

                if (boxData.refreshing) {
                    allRefreshingTodoBoxes.push(boxId);

                    totalTasksCompleted += boxData.tasks.completed.length;
                }

                if (totalTasksCompleted > 0) {
                    totalListsCompleted++;
                }
            });

            const diff = (new Date(today) - new Date(lastAccessedDate)) / (1000 * 60 * 60 * 24);

            // Record streaks
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

                    // Process only the still-refreshing tasks
                    if (!taskData.completedForGood) {
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
                    }
                });

                // Refresh the completed tasks
                todoBoxData.tasks.active = todoBoxData.tasks.active.concat(todoBoxData.tasks.completed.filter(task => !task.completedForGood));

                todoBoxData.tasks.completed = todoBoxData.tasks.completed.filter(task => task.completedForGood);

                localStorage.setItem(todoBoxId, JSON.stringify(todoBoxData));
            });

            // Set lastAccessedDate
            localStorage.setItem('lastAccessedDate', today);

            // Display the refresh notification w/ information
            let notifModal = new bootstrap.Modal(document.getElementById('refreshNotifModal'), {});
            notifModal.show();

            console.log(document.getElementById('task-completion-circle'));

            document.getElementById('task-completion-circle').dataset.percent = totalTasksCompleted / totalTasksNum * 100;
            document.getElementById('list-completion-circle').dataset.percent = totalListsCompleted / todoBoxes.length * 100;

            const progressCircles = document.getElementsByClassName('progress-circle');
            const animateCircle = (progressCircle) => {
                const circle = progressCircle.getElementsByClassName('progress')[0];
                const percent = progressCircle.dataset.percent;
                const percentText = progressCircle.getElementsByClassName('progress-text-percentage')[0];

                const radius = circle.r.baseVal.value;
                const circumference = radius * 2 * Math.PI;
                const offset = circumference - (percent / 100) * circumference;
                circle.style.strokeDashoffset = offset;

                let count = 0;
                const timer = setInterval(() => {
                    if (count >= percent) {
                        clearInterval(timer);
                    }
                    else {
                        count++;
                        percentText.textContent = `${count}%`;
                    }
                }, 15);
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('show');
                        animateCircle(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            Array.from(progressCircles).forEach(progressCircle => observer.observe(progressCircle));
        }
    }

    // sidebar toggle button
    const toggleBtn = document.getElementsByClassName('toggle-btn')[0];

    toggleBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('expand');

        if (sidebar.classList.contains('expand')) {
            openSidebar();
        }
        else {
            closeSidebar();
        }
    });

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // home page sidebar
    const homeSidebarList = document.getElementById('home-lists');
    let allTodoBoxIds = Object.keys(localStorage).filter(key => Number.isInteger(+key));

    allTodoBoxIds.forEach(boxId => {
        let todoBoxData = JSON.parse(localStorage[`${boxId}`]);

        let listLabel = document.createElement('li');
        listLabel.className = 'sidebar-item';
        listLabel.innerHTML = `<a class='sidebar-link'>${todoBoxData.title}</a>`
        homeSidebarList.appendChild(listLabel);
    });

    // track page sidebar
    const allRefreshingTodoBoxes = Object.entries(localStorage).filter((entry) => Number.isInteger(+entry[0]) && JSON.parse(entry[1]).refreshing);
    const trackTodoBoxIds = allRefreshingTodoBoxes.map(data => data[0]);

    const trackSidebarList = document.getElementById('track-lists');

    if (trackSidebarList) {
        trackTodoBoxIds.forEach(boxId => {
            let todoBoxData = JSON.parse(localStorage[`${boxId}`]);

            let listLabel = document.createElement('li');
            listLabel.innerHTML = `<a class='sidebar-link' style='cursor: pointer;'>${todoBoxData.title}</a>`

            // If in the track page
            // Else travel to the track page and run this
            listLabel.addEventListener('click', () => {
                if (typeof selectTodoList === 'function') {
                    selectTodoList(boxId);
                }
                else {
                    window.location.href = '/track';
                }
            });

            trackSidebarList.appendChild(listLabel);
        });
    }
});

function openSidebar() {
    document.body.style.paddingLeft = '277px';

    const chatInputField = document.getElementById('user-input-container');
    if (chatInputField) {
        chatInputField.style.paddingLeft = '277px';
    }
}

function closeSidebar() {
    document.body.style.paddingLeft = '93px';

    const chatInputField = document.getElementById('user-input-container');
    if (chatInputField) {
        chatInputField.style.paddingLeft = '93px';
    }
}
