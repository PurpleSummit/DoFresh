document.addEventListener('DOMContentLoaded', () => {
    // Activate sidebar link
    // document.querySelector('#sidebar-advice-link').className = 'nav-link active';
    
    let allReadMoreBtns = document.querySelectorAll('.advice-read-more');

    allReadMoreBtns.forEach((btn) => {
        let parentCard = btn.parentElement.parentElement;
        btn.onclick = () => {
            createArticle(parentCard.id);
        };
    });

});

function createArticle(articleId) {
    let adviceBody = document.getElementById('advice-body');
    let articleCard = document.getElementById(`${articleId}`);

    let articleData = { title: articleCard.getElementsByClassName('card-title')[0].innerHTML, subtitle: articleCard.getElementsByClassName('card-title')[0].innerHTML, image: `${articleCard.querySelector('img').src}`,  };

    adviceBody.style.display = 'flex';

    adviceBody.innerHTML = `
    <div class='advice-article-div'>
        <h1>${articleData.title}</h1>
        <h6>${articleData.subtitle}</h6>
        <img src='${articleData.image}'>
        <pre class='article-text'></pre>
    </div>`;

    if (articleId == 'advice2') {
        adviceBody.getElementsByClassName('article-text')[0].textContent = `If you're feeling unmotivated, a clear schedule allows you to commit with dedication!
                    1. Write down what you need to do. 
                    2. Review their priority levels.
                    3. Consider how tired you'll be after one task, how excited you are for another, and how much time one would take.`;
    }
}
