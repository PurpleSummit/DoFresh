// Refreshing mechanism
const date = new Date();
const offset = date.getTimezoneOffset() * 60000;
const today = new Date(date.getTime() - offset).toISOString().split('T')[0]; // Formatting into local-time ISO string

console.log(today);
fetch("/api/get-last-date/")
    .then(response => response.json())
    .then(async (data) => {
        const lastAccessedDate = data["last_accessed_date"];
        // REFRESHING LOGIC ☑️
        console.log("last accessed on", lastAccessedDate);
        globalThis.csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

        if (lastAccessedDate == null) {
            let welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal'), {});
            welcomeModal.show();

            await fetch("/set-last-date/", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            });
        }
        else {
            if (today != lastAccessedDate) {
                // Get all the refreshing to-do boxes
                await fetch("/record/", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        let totalTasksNum = data["total_tasks_num"];
                        let totalListsNum = data["total_lists_num"];
                        let totalTasksCompleted = data["total_tasks_completed"];
                        let totalListsCompleted = data["total_lists_completed"];

                        document.getElementById('task-completion-circle').dataset.percent = totalTasksCompleted / totalTasksNum * 100;
                        document.getElementById('list-completion-circle').dataset.percent = totalListsCompleted / totalListsNum * 100;

                        fetch("/set-last-date/", {
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            }
                        });

                        showRefreshModal();
                    });
            }
        }
    });

document.addEventListener('DOMContentLoaded', () => {

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

function showRefreshModal() {
    // Display the refresh notification w/ information
    let notifModal = new bootstrap.Modal(document.getElementById('refreshNotifModal'), {});
    notifModal.show();

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
