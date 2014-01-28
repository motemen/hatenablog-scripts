(function (cb) {
    if (typeof jQuery !== 'undefined') {
        jQuery(function () { cb(jQuery) });
        return;
    }

    var poll = arguments.callee;
    setTimeout(function () { poll(cb) }, 50);
})

(function ($) {
    var config = $.extend(window.__hatenablog_show_same_category_entries, {
        parentSelector: 'article',
        maxEntries: 3, // or -1 for unlimited
        style: [
            '.same-category-entries {',
                'margin: 1em;',
                'font-size: 90%;',
            '}',
            '.same-category-entry-summary {',
                'color: #666;',
            '}',
            'a.same-category-entries-category-name, a.same-category-entries-category-name:visited {',
                'color: inherit;',
            '}',
            '.same-category-entries-category-name:before {',
                'content: "「";',
            '}',
            '.same-category-entries-category-name:after {',
                'content: "」";',
            '}',
            '.same-category-entry-meta {',
                'color: #CCC;',
                'margin-top: 0.5em;',
            '}',
        ].join('\n'),
        template: [
            '<div class="same-category-entries">',
            '<% _.each(categories, function (category) { %>',
                '<% if (category.entries.length > 0) { %>',
                '<div class="same-category-entries-category">',
                    '<h2><a class="same-category-entries-category-name" href="/category/<%- category.name %>"><%- category.name %></a>カテゴリの他のエントリ</h2>',
                    '<% _.each(category.entries, function (entry) { %>',
                        '<div class="same-category-entries-entry">',
                            '<h3 class="same-category-entries-entry-title">',
                                '<a href="<%- entry.url %>"><%- entry.title %></a>',
                            '</h3>',
                            '<div class="same-category-entry-summary">',
                                '<%- entry.summary %>',
                            '</div>',
                            '<div class="same-category-entry-meta">',
                                '<time datetime="<%- entry.published.toISOString() %>">',
                                    '<%- entry.published.toLocaleString() %>',
                                '</time>',
                            '</div>',
                        '<div>',
                    '<% }) %>',
                '</div>',
                '<% } %>',
            '<% }) %>',
            '</div>'
        ].join('')
    });

    var origin = location.protocol + '//' + location.host;
    var categoryMetas = $('meta[property="article:tag"]').toArray();
    var $entry = $('article');

    var startFetchCategoryEntries = function (d, categories) {
        d = d || $.Deferred();
        categories = categories || [];

        var categoryMeta = categoryMetas.shift();
        if (!categoryMeta) {
            d.resolve(categories);
            return d;
        }

        var category = {
            name: $(categoryMeta).attr('content'),
            entries: []
        };

        $.ajax(origin + '/feed/category/' + encodeURIComponent(category.name)).done(function (feed) {
            $(feed).find('entry').each(function () {
                var $feedEntry = $(this);

                var entry = {
                    title:       $feedEntry.find('title').text(),
                    url:         $feedEntry.find('link').attr('href'),
                    summary:     $feedEntry.find('summary').text(),
                    contentHTML: $feedEntry.find('content[type="html"]').text(),
                    published:   new Date($feedEntry.find('published').text())
                };

                if (entry.url === origin + location.pathname) return;

                category.entries.push(entry);

                if (category.entries.length >= config.maxEntries && config.maxEntries !== -1) {
                    return false;
                }
            });

            categories.push(category);

            startFetchCategoryEntries(d, categories);
        }).fail(function (xhr) {
            (console.error || console.log).call(console, xhr);
        });

        return d;
    };

    startFetchCategoryEntries().done(function (categories) {
        var html = _.template(config.template, { categories: categories });
        var $html = $($.parseHTML(html));
        $entry.append($html);

        if (config.style) {
            $('<style type="text/css">').html(config.style).appendTo('head');
        }
    });
});
