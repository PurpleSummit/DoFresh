function openNav() {
    let sidebarNav = document.querySelector('#conversations-sidebar');
    sidebarNav.style.width = '200px';

    let openBtn = document.querySelector('#sidebar-open-btn');
    openBtn.className = 'btn btn-light';
    openBtn.ariaLabel = 'Close';
    openBtn.onclick = closeNav;
}

function closeNav() {
    let sidebarNav = document.querySelector('#conversations-sidebar');
    sidebarNav.style.width = '0px';

    let openBtn = document.querySelector('#sidebar-open-btn');
    openBtn.className = 'btn btn-light';
    openBtn.ariaLabel = '';
    openBtn.onclick = openNav;
}
