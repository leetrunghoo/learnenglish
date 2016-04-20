var fs = require('fs'); // for writing file
var request = require('request'); // for making HTTP calls
var cheerio = require('cheerio'); // jQuery for the server, helps us traverse the DOM and extract data
var mkdirp = require('mkdirp'); // make dir
var getDirName = require('path').dirname; // get dir name by dest param
var breakTime = 100; // break time when scraping many links
var flagCrawlerSound = false;

// make a http request to get the html, then using scraperLogic to handle
function scraper(url, scraperLogic) {
    request(url, function(error, response, html) {
        if (!error) {
            if (typeof scraperLogic === 'function') {
                scraperLogic(html);
            }
        }
    });
}

// note: category -> section -> lesson
var cateIndex = 0;
var lessonIndex = 0;

function scraperLogic_listLessons(html) {
    var $ = cheerio.load(html);

    var result = {
        description: 'List of lessons of talkenglish.com, it was scraped from http://www.talkenglish.com/lessonindex.aspx for personal use',
        categories: []
    };
    var arrLessons = []; // arrLessons will be used to scrape lessons' content later

    // Special case: Speaking English Lessons
    // because it has too many lessons so I'd like to divide it into many categories
    // Others categories: English Listening Lessons, Extra English Lessons, English Speaking Articles
    var $categories_speaking = $('.sidebar-menu .treeview:first-child').children('.treeview-menu').children('li');
    var $categories = $('.sidebar-menu .treeview');
    loopCategoryOfSpeaking(0, $categories_speaking);

    function loopCategoryOfSpeaking(i, pCategories) {
        if (i < pCategories.length) {
            var $category = pCategories.eq(i);
            var cateTitle = $category.children('a').text();
            var cateLink = 'http://www.talkenglish.com' + $category.children('a').attr('href');
            var category = {
                title: cateTitle,
                description: '',
                sections: []
            };
            console.log('==================== cateLink: ', cateLink);
            console.log('==================== cate index: ' + i + ' - length:' + pCategories.length);

            // need to scrape each category speaking to get list section, except last category: 'special topics'
            scraper(cateLink, function(html) {
                var $ = cheerio.load(html);
                var $sections = $('.list-page-wrapper div:first-child > div a');
                console.log('number of sections of sub cate speaking ', $sections.length);

                loopSection(0, $sections);

                function loopSection(sectionIndex, $sections) {
                    var $eleSection = $sections.eq(sectionIndex);
                    var link = $eleSection.attr('href');
                    var section = {
                        title: $eleSection.text(),
                        description: '',
                        link: buildFullLink(cateLink, $eleSection.attr('href')),
                        lessons: []
                    };
                    console.log('scraping Section ', section.title + ' - ' + section.link);
                    scrapingSection(cateIndex, sectionIndex, section, function(sectionEdited) {
                        console.log('----------scraped Section:', sectionEdited.title);
                        // arrLessons will be used to scrape lessons' content later
                        arrLessons = arrLessons.concat(sectionEdited.lessons);

                        // delete unnecessary attr
                        for (var iii = 0; iii < sectionEdited.lessons.length; iii++) {
                            delete sectionEdited.lessons[iii].categoryIndex;
                            delete sectionEdited.lessons[iii].sectionIndex;
                        }
                        category.sections.push(sectionEdited);

                        if (sectionIndex === $sections.length - 1) { // the end of looping section
                            $('.content .list-page-wrapper').remove();
                            category.description = $('.content td:first-child').html() || $('.content').text();
                            result.categories.push(category);

                            cateIndex++;
                            // the end of looping category speaking (don't scrape 'Special Topics') => scrape next category
                            if (i === pCategories.length - 2) {
                                loopCategory(1);
                            } else {
                                loopCategoryOfSpeaking(++i, pCategories);
                            }
                        } else {
                            loopSection(++sectionIndex, $sections);
                        }
                    });
                };
            });
        }
    }

    function loopCategory(i) {
        if (i === 1 || i === 2 || i === 4) { // just scraping these categories
            var $category = $categories.eq(i);
            var cateTitle = $category.children('a').children('span').text();
            var cateLink = $category.children('a').attr('href');
            console.log('==================== cateTitle: ', cateTitle);
            var category = {
                title: cateTitle,
                description: '',
                sections: []
            };
            var $sections = $category.children('.treeview-menu').children('li');
            if (i === 1) { // listening category => start with second section
                loopSection(1, $sections);
            } else {
                loopSection(0, $sections);
            }

            function loopSection(sectionIndex, $sections) {
                var $eleSection = $sections.eq(sectionIndex);
                console.log('scraping Section ', $eleSection.children('a').text());

                var section = {
                    title: $eleSection.children('a').text(),
                    description: '',
                    link: buildFullLink(cateLink, $eleSection.children('a').attr('href')),
                    lessons: []
                };
                scrapingSection(cateIndex, sectionIndex, section, function(sectionEdited) {
                    console.log('----------scraped Section:', sectionEdited.title);
                    category.sections.push(sectionEdited);
                    // arrLessons will be used to scrape lessons' content later
                    arrLessons = arrLessons.concat(sectionEdited.lessons);

                    if (sectionIndex === $sections.length - 1) { // the end of looping section
                        result.categories.push(category);
                        cateIndex++;
                        if (i === 4) { // the end of looping category => save file
                            // store the files
                            var dest = 'app/data/listLessons.json';
                            saveFile(dest, JSON.stringify(result, null, 4), function(err) {
                                //scraping list of lessons
                                scrapingLessons(arrLessons);
                            });
                        } else {
                            loopCategory(++i);
                        }
                    } else {
                        loopSection(++sectionIndex, $sections);
                    }
                });
            };
        } else {
            if (i < $categories.length - 1) {
                loopCategory(++i);
            }
        }
    }
}

function scrapingSection(cateIndex, sectionIndex, section, callback) {
    // scraping section page to get section's description & list lessons
    console.log('section.link', section.link);
    scraper(section.link, function(html) {
        var $ = cheerio.load(html);
        var $lessons = $('.list-page-wrapper table div.list-page > div > div a');
        if ($lessons.length === 0) {
            $lessons = $('.list-page-wrapper div:first-child > div a')
        }
        console.log('number of lessons: ', $lessons.length);
        $lessons.each(function(iii, a) {
            console.log('lesson title:', $(a).text());
            section.lessons.push({
                lessonIndex: lessonIndex++,
                categoryIndex: cateIndex,
                sectionIndex: sectionIndex,
                title: $(a).text(),
                link: buildFullLink(section.link, $(a).attr('href'))
            });
        });
        $('.content .list-page-wrapper').remove();
        section.description = $('.content td:first-child').html() || $('.content').text();
        callback(section);
    });
}

function scrapingLessons(arrLessons) {
    var startTime = Date.now();
    var sounds = {
        description: 'List of sounds link of lessons',
        data: []
    }
    runScraping(0);

    function runScraping(index) {
        if (index < arrLessons.length) {
            // arrLessons[index].lessonIndex = index;
            var lesson = arrLessons[index];
            console.log('start scraping lessonIndex ' + lesson.lessonIndex + ' --- ' + lesson.title);
            scrapingLesson(lesson, function(arrSoundLinks) {
                console.log('----------done scraping lessonIndex ', lesson.lessonIndex);

                //concat array of sound links
                if (arrSoundLinks.length > 0) {
                    sounds.data = sounds.data.concat(arrSoundLinks);
                }

                // store list of sound links after finish looping
                if (index === arrLessons.length - 1) {
                    if (flagCrawlerSound && sounds.data.length > 0) {
                        var dest = 'app/data/listSounds.json';
                        saveFile(dest, JSON.stringify(sounds, null, 4), function(err) {});
                    }
                    var processTime = Date.now() - startTime;
                    console.log('process time: ' + (processTime / 60000).toFixed(2) + " mins");
                } else {
                    runScraping(++index);
                }
            });
        }
    }
}

function scrapingLesson(lesson, callback) {
    scraper(lesson.link, function(html) {
        var $ = cheerio.load(html);
        var lessonsContent = lesson;
        lessonsContent.html = $('#GridView1 td').html() || '<h1>' + lesson.title + '</h1>' + $('.content td:first-child').html();

        // get sounds link
        var arrLinks = [];
        if (flagCrawlerSound) {
            $('#GridView1 a').each(function(i, a) {
                var linkSound = $(this).attr('href');
                if (linkSound.indexOf('mp3') > -1) {
                    arrLinks.push({
                        text: $(this).text(),
                        link: linkSound
                    });
                    // console.log(linkSound);
                }
            });
        }

        var dest = 'app/data/lessons/' + lesson.lessonIndex + '.json';
        saveFile(dest, JSON.stringify(lessonsContent, null, 4), function(err) {
            callback(arrLinks);
        });
    });
}

function saveFile(dest, data, callback) {
    mkdirp(getDirName(dest), function(err) {
        if (err) {
            console.log('>>>>>>>>> error while write file ', dest);
            callback(err)
        }
        fs.writeFile(dest, data, function(err) {
            console.log(dest + ' is successfully written!');
            callback();
        });
    });
}

function buildFullLink(currentLink, link) {
    if (link.substring(0, 1) === '/') {
        return 'http://www.talkenglish.com' + link;
    } else {
        var preLink = currentLink.substring(0, currentLink.lastIndexOf('/') + 1);
        return preLink + link;
    }
}


// run scraper to get list of lessons and lessson's content
scraper('http://www.talkenglish.com/lessonindex.aspx', scraperLogic_listLessons);
