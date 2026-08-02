document.addEventListener('DOMContentLoaded', () => {
    let allReadMoreBtns = document.querySelectorAll('.advice-read-more');

    allReadMoreBtns.forEach((btn) => {
        let parentCard = btn.parentElement.parentElement;
        btn.onclick = () => {
            createArticle(parentCard.id);
        };
    });
});


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

function createArticle(articleId) {
    let adviceBody = document.querySelector('#advice-body');
    let articleCard = document.querySelector(`#${articleId}`);

    let articleData = { title: articleCard.querySelector('.card-title').innerHTML, subtitle: articleCard.querySelector('.card-text').innerHTML, image: `${articleCard.querySelector('img').src}`,  };
    console.log(articleData);

    adviceBody.style.display = 'flex';

    adviceBody.innerHTML = `
    <div class='advice-article-div'>
        <h1>${articleData.title}</h1>
        <h6>${articleData.subtitle}</h6>
        <img src='${articleData.image}' style='width: 600px;'>
    </div>`;
}
