document.addEventListener('DOMContentLoaded', () => {
    let allReadMoreBtns = document.querySelectorAll('.advice-read-more');

    allReadMoreBtns.forEach((btn) => {
        let parentCard = btn.parentElement.parentElement;
        btn.onclick = () => {
            createArticle(parentCard.id);
        };
    });

    // Activate link
    document.querySelector('#sidebar-advice-link').className = 'nav-link active';
});

function createArticle(articleId) {
    let adviceBody = document.querySelector('#advice-body');
    let articleCard = document.querySelector(`#${articleId}`);

    let articleData = { title: articleCard.querySelector('.card-title').innerHTML, subtitle: articleCard.querySelector('.card-text').innerHTML, image: `${articleCard.querySelector('img').src}`,  };

    adviceBody.style.display = 'flex';

    adviceBody.innerHTML = `
    <div class='advice-article-div'>
        <h1>${articleData.title}</h1>
        <h6>${articleData.subtitle}</h6>
        <img src='${articleData.image}'>
    </div>`;
}
