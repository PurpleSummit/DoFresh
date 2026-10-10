document.addEventListener('DOMContentLoaded', () => {

    let allArticleBtns = document.querySelectorAll('.go-to-article');

    allArticleBtns.forEach((btn) => {
        btn.onclick = () => {
            fetch(`/article/${articleId}`);
        };
    });

});
