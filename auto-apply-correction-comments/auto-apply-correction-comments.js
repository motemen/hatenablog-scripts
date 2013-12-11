(function () {
    var selector = window.__hatenablog_auto_apply_correction_comments && window.__hatenablog_auto_apply_correction_comments.selector || '.comment-box .comment';

    var cc = document.querySelectorAll(selector);
    for (var i = 0; i < cc.length; i++) {
        var container = cc[i];
        var mo = new MutationObserver(function (mm) {
            _.each(mm, function (m) {
                _.each(m.addedNodes, function (n) {
                    if (!/\bentry-comment\b/.exec(n.className)) return;

                    var comment = $.trim($(n).find('.comment-content').text());
                    var $content = $(container).closest('article').find('.entry-content');
                    var m = /^s\/((?:\\\/|.)+)\/(.+)\/$/.exec(comment);
                    if (m) {
                        var from = m[1], to = m[2],
                            fromRe = new RegExp(from.replace(/\W/g, '\\$&'), 'g');

                        var mkHtml = function (tag, text) { return '<'+tag+'>' + $('<div>').text(text).html() + '</'+tag+'>' };

                        var hit = false;
                        var corrected = _.map($content.html().split(/(<.*?>)/), function (p) {
                            if (p.indexOf('<') === 0) {
                                return p;
                            } else {
                                return p.replace(fromRe, function (from) {
                                    hit = true;
                                    return mkHtml('del', from) + mkHtml('ins', to);
                                });
                            }
                        }).join('');

                        $content.html(corrected);

                        if (hit) {
                            $(n).addClass('hatenablog-auto-apply-correction-comments-hit');
                        }
                    }
                })
            });
        })
        mo.observe(container, { childList: true });
    };
})();
