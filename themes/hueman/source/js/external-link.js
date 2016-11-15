(function ($) {
    $('.article-entry a').filter(function(index, link) {
        return link.hostname != window.location.hostname;
    }).attr('target', '_blank').addClass('external-link');
})(jQuery);
