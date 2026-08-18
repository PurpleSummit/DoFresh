document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.querySelector('.toggle-btn');
    const toggler = document.querySelector('#icon');

    toggleBtn.addEventListener('click', () => {
        const sidebar = document.querySelector('#sidebar');
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
    const homeSidebarList = document.querySelector('#home-lists');
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

    const trackSidebarList = document.querySelector('#track-lists');

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

    const chatInputField = document.querySelector('#user-input-container');
    if (chatInputField) {
        chatInputField.style.paddingLeft = '277px';
    }
}

function closeSidebar() {
    document.body.style.paddingLeft = '93px';

    const chatInputField = document.querySelector('#user-input-container');
    if (chatInputField) {
        chatInputField.style.paddingLeft = '93px';
    }
}
