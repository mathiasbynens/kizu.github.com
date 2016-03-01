// Requires
var fs = require('fs');
var express = require('express');

var gulp = require('gulp');
var watch = require('gulp-watch');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var runSequence = require('run-sequence');
var foreach = require('gulp-foreach');
var data = require('gulp-data');
var each = require('each-done');
var source = require('vinyl-source-stream');

var jade = require('gulp-jade');
var stylus = require('stylus');
var posthtml = require('posthtml');
var yamlFront = require('yaml-front-matter');
var moment = require('moment');

var typography = require(process.cwd() + '/gulpfile.js/typography.js');
var marked_overloaded = require(process.cwd() + '/gulpfile.js/marked_overloaded.js');
var marked_renderers = require(process.cwd() + '/gulpfile.js/marked_renderers.js');
var handle_demos = require(process.cwd() + '/gulpfile.js/handle_demos.js');

// Constants
var pathsParts = {
    'start': '^',
    'path': '((?:[^\/]+\/)*)?',             // like `foo/bar/`
    'date': '(?:(\\d{4}-\\d{2}-\\d{2})-)?', // like `2015-12-02`
    'categories': '(\\([^\\)]+\\)-)?',      // like `(issues old)`
    'notIndex': '(?!index)',
    'slug': '([^\/\\.\\_]+)',      // like `whatever-title`
    'isInFolder': '(?:\/(index))?',         // like `/index`
    'lang': '(?:\\.(\\w{2}))?',             // like `en`
    'extensions': '((?:\\.[^\\.\\/]+)+)',   // like `.md`
    'end': '$'
};

var pathRegexps = {
    'post': new RegExp([
            pathsParts.start,
            pathsParts.path,
            pathsParts.date,
            pathsParts.categories,
            pathsParts.notIndex,
            pathsParts.slug,
            pathsParts.isInFolder,
            pathsParts.lang,
            pathsParts.extensions,
            pathsParts.end
        ].join('')),
    'page': new RegExp([
            pathsParts.start,
            pathsParts.path,
            pathsParts.slug,
            pathsParts.isInFolder,
            pathsParts.lang,
            pathsParts.extensions,
            pathsParts.end
        ].join(''))
}

// All the site's options and settings
var site = require(process.cwd() + '/site.json')

// Global stuff
var documents = [];
var loc_strings = {};
var documentsByLang = {};

// Helper functions

var rerequire = function(path) {
    delete require.cache[require.resolve(path)];
    return require(path);
}

var storeDocument = function(stream, file) {
    var document = {};
    if (file.base.match(new RegExp(site.postsDir + '$'))) {
        document.type = 'post';
    } else if (file.base.match(new RegExp(site.pagesDir + '$'))) {
        document.type = 'page';
    }

    document.relativePath = file.relative;
    var pathData = file.relative.match(pathRegexps[document.type] || '');
    if (!pathData) {
        console.warn('No patdata found for ' + document.relativePath);
        return stream;
    } else {
        // FIXME: not optimal -_-
        if (document.type === 'post') {
            document.path = pathData[1];
            document.date = pathData[2];
            document.categories = pathData[3];
            document.slug = pathData[4];
            document.isInFolder = pathData[5];
            document.lang = pathData[6];
            document.extension = pathData[7];
        } else if (document.type === 'page') {
            document.path = pathData[1];
            document.slug = pathData[2];
            document.isInFolder = pathData[3];
            document.lang = pathData[4];
            document.extension = pathData[5];
        }
    }

    document.initialUrl = (document.path || '') + (document.date && document.date + '-' || '') + (document.categories || '') + document.slug + '/';
    document.filename = (document.isInFolder || '') + (document.lang && '.' + document.lang || '') + document.extension;
    document.resources = {};

    if (document.categories) {
        document.categories = document.categories.replace(/^\((.+)\)-$/, '$1').split(' ');
    } else if (document.type === 'post') {
        document.categories = [site.defaultCategory];
    }

    // TODO: properly handle filename and the case when the resources are not in dir
    if (document.isInFolder) {
        var directory = file.base + document.initialUrl;

        // TODO: rewrite this stuff hardly!
        var getTranslations = function(fileName) {
            if (document.lang !== 'en' && fileName === (document.isInFolder || '') + '.en' + document.extension) {
                if (!document.translations) {
                    document.translations = {};
                }
                document.translations.en = true;
            } else if (document.lang !== 'ru' && fileName === (document.isInFolder || '') + '.ru' + document.extension) {
                if (!document.translations) {
                    document.translations = {};
                }
                document.translations.ru = true;
            }
        };

        var neighbouringFiles = fs.readdirSync(directory);
        if (neighbouringFiles) {
            for (var i = 0; i < neighbouringFiles.length; i++) {
                if (neighbouringFiles[i] === '_data.json') {
                    document.metadataFile = require(directory + '_data.json');
                } else {
                    getTranslations(neighbouringFiles[i]);
                }
            }
        }

    }

    document.url = (document.lang != site.defaultLanguage ? document.lang + '/' : '') + (document.categories ? document.categories.join('/') + '/' : '') + document.slug + '/';

    if (document.type == 'page') {
        document.url = document.url.replace(/(^|\/)index\/$/, '');
    }

    // Transform markdown to HTML
    // TODO: Move to its own process, so we could watch just renderers and stuff
    // TODO: get the title from markdown
    document.rawContent = file.contents.toString();
    document.YAMLmetadata = yamlFront.loadFront(document.rawContent);
    var content = document.YAMLmetadata.__content;
    delete document.YAMLmetadata.__content;

    document.content = marked_overloaded(content, marked_renderers);
    // TODO: can this be made using just one posthtml pass?
    if (document.content.substr(0, 4) === '<h1 ') {
        var firstLine = document.content.substr(0, document.content.indexOf('</h1>') + 5);
        if (firstLine) {
            document.titleHTML = firstLine;
            firstLine = posthtml()
                .use( function(tree) {
                    var result = '';
                    tree.walk(function(node) {
                        textNode = node
                        if (typeof(textNode) == 'string') {
                            result += textNode;
                        }
                        return textNode
                        });
                    return result
                })
                .process(document.titleHTML, { sync: true });

            document.title = firstLine.html;
            document.content = document.content.replace(document.titleHTML, '');
        }
    }

    document.content = typography(document.content, document.lang);

    // Combining all the metadata
    document.metadata = {}
    if (document.YAMLmetadata) {
        for (key in document.YAMLmetadata) {
            if (!document.metadata[key]) {
                document.metadata[key] = document.YAMLmetadata[key];
            }
        }
        delete document.YAMLmetadata;
    }
    if (document.metadataFile) {
        for (key in document.metadataFile) {
            if (!document.metadata[key]) {
                var value = document.metadataFile[key];
                if (value[document.lang]) {
                    document.metadata[key] = value[document.lang];
                } else {
                    document.metadata[key] = value;
                }
            }
        }
        delete document.metadataFile;
    }
    for (key in document.metadata) {
        if (typeof document.metadata[key] === 'string') {
            document.metadata[key] = marked_overloaded(document.metadata[key], marked_renderers).replace(/^<p>((?:(?!<p>).)+)<\/p>\s*$/, '$1');
        }
    }
    if (document.relativePath.indexOf('drafts/') === -1 && !document.metadata.invisible) {
        documentsByLang[document.lang].push(document);
    } else {
        document.isDraft = true;
    }

    // console.log(document);
    documents.push(document);

    return stream;
};

var writeDocument = function(document) {
    document.content = handle_demos(document);
    var loc = function(locString, lang) {
        return loc_strings[locString] && loc_strings[locString][lang || document.lang] || 'No loc string found!'
    };
    var jadeData = {
        'documents': documentsByLang[document.lang],
        'document': document,
        'site': site,
        'loc': loc,
        'comma_and_join': function(array) {
            if (typeof array === 'string') {
                return array;
            }
            var result = '';
            for (var i = 0; i < array.length; i++) {
                if (i > 0) {
                    if (array.length > 1) {
                        if (i !== (array.length - 1)) {
                            result += ',';
                        } else {
                            result += ' ' + loc('and');
                        }
                    }
                    result += ' ';
                }
                result += array[i];
            }
            return result;
        },
        'published_format': function(date) {
            date = moment(date).locale(document.lang);
            var now = moment();
            var result = date.format('LL');
            // Don't show the current year
            if (now.year() === date.year()) {
                result = result.replace(/, \d{4}|\d{4} г\./, '');
            }
            // In russian months should be lowercase when in middle
            if (document.lang === 'ru') {
                result = result.toLowerCase();
            }
            return result;
        }
    };
    return gulp.src(site.layoutsDir + site.defaultLayout)
        .pipe(data(function(){return jadeData}))
        .pipe(jade({ pretty: true }))
        .pipe(rename({ dirname: document.url }))
        .pipe(rename({ basename: 'index' }))
        .pipe(gulp.dest(site.output));
};

var handleResource = function(document) {
    return function(stream, resource) {
        var resultStream = stream;

        var documentName = document.url.match(/\/([^\/]+)\/$/);
        documentName = documentName && documentName[1];
        var resPath = resource.history[0].match(new RegExp('[\/\-]' + documentName + '\/(.+\/)?([^\/]+)\\.([^\\.]+)$'));
        if (!resPath) {
            return stream;
        }
        var resName = resPath[2];
        var finalPath = document.url;
        if (resPath[1]) {
            finalPath += resPath[1];
        }

        if (resource.history[0].match(/\.html$/)) {
            var contents = resource._contents.toString();
            var YAMLmetadata = yamlFront.loadFront(contents);
            YAMLmetadata.content = YAMLmetadata.__content

            // Store the resource
            var resRelName = resName;
            if (resPath[1]) {
                resRelName = resPath[1] + resRelName;
            }
            YAMLmetadata.relName = resRelName;
            document.resources[resName] = YAMLmetadata;

            // Compile and write if the resource is not injected
            if (YAMLmetadata && YAMLmetadata.layout && !YAMLmetadata.injected) {
                resultStream = gulp.src(site.layoutsDir + YAMLmetadata.layout + '.jade')
                    .pipe(data(function(){return YAMLmetadata}))
                    .pipe(jade({ pretty: true }));
            } else {
                return stream;
            }
        }
        return resultStream
            .pipe(rename({ dirname: finalPath }))
            .pipe(rename({ basename: resName }))
            .pipe(gulp.dest(site.output));

    }
}
var handleResources = function(document) {
    // TODO: properly detect those resources to write and probably rename
    return gulp.src([site.postsDir + document.initialUrl + '**', '!' + site.postsDir + document.initialUrl + '*.md', '!' + site.postsDir + document.initialUrl + '_*'])
        .pipe(foreach(handleResource(document)))
};

var buildStylus = function(stream, stylesheet) {
    style = stylus(stylesheet.contents.toString())
        .set('filename', stylesheet.base + stylesheet.relative)
        .set('include css', true)
        .define('site', site, true)
    if (site.debug && stylesheet.relative === 'style.styl') {
        style.set('sourcemap', { 'inline': true });
    }
    style.render(function(err, output) {
        if (err) {
            console.error(err);
        } else {
            var stylesheetStream = source(stylesheet.relative.replace('.styl', '.css'));
            stylesheetStream.end(output);
            stylesheetStream.pipe(gulp.dest(site.stylesOutput));
        }
    });
    return stream;
};

// Tasks

gulp.task('get-documents', function(done) {
    documents = [];
    for (var i = 0; i < site.languages.length; i++) {
        documentsByLang[site.languages[i]] = [];
    };

    return gulp
        .src([site.postsDir + '**/*.md', site.pagesDir + '**/*.md'])
        .pipe(foreach(storeDocument));

});

gulp.task('classify-documents', function(done) {
    // Do everything for each lang group
    for (var i = 0; i < site.languages.length; i++) {
        var docs = documentsByLang[site.languages[i]];

        // Sort docs by date
        docs.sort(function(a, b){
            return new Date(b.date) - new Date(a.date);
        });

        for (var j = 0; j < docs.length; j++) {
            var current = docs[j];
            if (j !== 0) {
                current.next = docs[j - 1];
            }
            if (j !== docs.length - 1) {
                current.prev = docs[j + 1];
            }
        };
    };

    done();
});

gulp.task('write-documents', function(done) {
    loc_strings = rerequire(process.cwd() + '/gulpfile.js/loc_strings.json');
    each(documents, writeDocument, done);
});

gulp.task('handle-resources', function(done) {
    each(documents, handleResources, done);
});

gulp.task('documents', function(done) {
    runSequence('get-documents', 'classify-documents', 'handle-resources', 'write-documents', done);
});

gulp.task('styl', function(done) {
    return gulp
        .src(site.stylesDir + '*.styl')
        .pipe(foreach(buildStylus));
});

gulp.task('scripts', function(done) {
    return gulp
        .src(site.scriptsDir + '*')
        .pipe(gulp.dest(site.scriptsOutput));
});

gulp.task('express', function() {
  express().use(express.static(site.output)).listen(site.watchPort);
  gutil.log('Server is running on http://localhost:' + site.watchPort);
});

gulp.task('build', ['documents', 'styl', 'scripts']);

gulp.task('watch', ['express', 'build'], function() {
    // Watching documents and rebuilding all of them
    watch(site.postsDir + '**/*', function() { gulp.start('documents'); });

    // Watch jade layouts and rewrite documents without recollecting
    watch([site.layoutsDir + '*.jade', './gulpfile.js/loc_strings.json'], function() { gulp.start('write-documents'); });

    // Watch .styl files and rebuild all the styles
    watch([site.stylesDir + '*.styl', './src/styl/**/*.styl'], function() { gulp.start('styl'); });
});

gulp.task('default', ['watch']);