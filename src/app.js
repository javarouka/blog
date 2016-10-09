import './css/index.css'
import 'prismjs/themes/prism-okaidia.css'
import Prism from 'prismjs'

function applySyntaxHighliting() {
    const syntaxTargets = document.querySelectorAll('pre code[data-language]');
    syntaxTargets.forEach(target => {
        const code = target.innerHTML;
        var html = Prism.highlight(code, Prism.languages[target.dataset.language] || Prism.languages.javascript);
        target.innerHTML = html;
    });
}

Prism.highlightAll();
//applySyntaxHighliting();