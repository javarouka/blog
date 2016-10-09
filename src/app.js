import './css/index.css'
import 'prismjs/themes/prism.css'
import prism from 'prismjs'

function applySyntaxHighliting() {
    const syntaxTargets = document.querySelectorAll('pre code[data-language]');
    syntaxTargets.forEach(target => {
        const code = target.innerHTML;
        var html = prism.highlight(code, prism.languages[target.dataset.language] || prism.languages.javascript);
        target.innerHTML = html;
    });
}

applySyntaxHighliting();