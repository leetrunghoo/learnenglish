(function() {
    'use strict';

    checkSW();

    var sideBarTpl_raw = $("#sideBarTpl").html();
    var sideBarTpl = Handlebars.compile(sideBarTpl_raw);
    var sectionTpl_raw = $("#sectionTpl").html();
    var sectionTpl = Handlebars.compile(sectionTpl_raw);

    var audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.onended = function() {
        $('.playingAudio').removeClass('playingAudio');
    };

    $('.modal-trigger').leanModal();

    $.getJSON('data/listLessons.json', function(data) {
        $('#slideNav').html(sideBarTpl(data));

        // Initialize collapse button
        $(".button-collapse").sideNav();
        // Initialize collapsible (uncomment the line below if you use the dropdown variation)
        $('.collapsible').collapsible();

        $('li.section-item').click(function() {
            $('.section-item').removeClass('selected');
            $(this).addClass('selected');
            $('.button-collapse').sideNav('hide'); // Hide sideNav

            var sectionIndex = $(this).index();
            var cateIndex = $(this).parents('.category-item').index();
            var sectionData = data.categories[cateIndex].sections[sectionIndex];
            $('#mainContent').html(sectionTpl(sectionData));
            $('#sectionDesc').html(sectionData.description);
            $('body,html').scrollTop(0);
            $('.masonry').masonry({
                // use outer width of grid-sizer for columnWidth
                itemSelector: '.grid-item',
                // do not use .grid-sizer in layout
                columnWidth: '.grid-item',
                percentPosition: true
            });
        });
        // $('li.section-item:nth-child(10)').click()
    });

    $(document).on('click', '.lesson-item', function() {
        $('#modalLesson').openModal({
            complete: function() { // Callback for Modal close
                audioPlayer.pause();
            }
        });
        $('#lessonContent').empty();
        $('#modalLesson .modal-content').scrollTop(0);
        var lessonIndex = $(this).data('lesson');
        $.getJSON('data/lessons/' + lessonIndex + '.json', function(lesson) {
            $('#lessonTitle').text(lesson.title);
            // remove ad
            lesson.html = lesson.html.replace('<br><br><b>Download all the conversations</b> for your mp3 player. Hundreds of dialogs and printable lessons are available for download in the TalkEnglish Offline Package. &#xA0;Go to the <a href=\"/english-download.aspx\">English Download</a> page and download today!<br><br><br>', '');
            $('#lessonContent').html(lesson.html);
            $('#lessonContent table').addClass('striped');
        });
    });
    $(document).on('click', 'a', function(e) {
        if (e.target.href && e.target.href.indexOf('.mp3') > -1) {
            e.preventDefault();
            $('.playingAudio').removeClass('playingAudio');
            $(this).addClass('playingAudio');
            audioPlayer.src = e.target.href;
            audioPlayer.play();
        }
    });

})();

// load font
function loadFont(fontName) {
    fontName = fontName.replace(/\s+/g, '+');
    var linkFont = document.createElement('link');
    linkFont.rel = 'stylesheet';
    linkFont.type = 'text/css';
    linkFont.href = 'https://fonts.googleapis.com/css?family=' + fontName + ':100,400';
    document.getElementsByTagName('head')[0].appendChild(linkFont);
}
// loadFont('Roboto');

// These functions for Quiz question in Listening category. The code was got from talkenglish.com
function showHide(elementid) {
    if (document.getElementById(elementid).style.display == 'none') { document.getElementById(elementid).style.display = ''; } else { document.getElementById(elementid).style.display = 'none'; }
}

function CheckScore() {
    for (var i = 0; i < 4; i++) {
        if (MyForm.Question1[i].checked) {
            var Ques1UserAnswer = MyForm.Question1[i].value;
        }
        if (MyForm.Question2[i].checked) {
            var Ques2UserAnswer = MyForm.Question2[i].value;
        }
        if (MyForm.Question3[i].checked) {
            var Ques3UserAnswer = MyForm.Question3[i].value;
        }
        if (MyForm.Question4[i].checked) {
            var Ques4UserAnswer = MyForm.Question4[i].value;
        }
    }
    var Score = 0;
    var CorrectAnswers = MyForm.CorrectAnswers.value;
    if (Ques1UserAnswer == CorrectAnswers.substr(0, 1)) Score++;
    if (Ques2UserAnswer == CorrectAnswers.substr(1, 1)) Score++;
    if (Ques3UserAnswer == CorrectAnswers.substr(2, 1)) Score++;
    if (Ques4UserAnswer == CorrectAnswers.substr(3, 1)) Score++;
    ScoreText.innerHTML = "<font size=2>Your Score is: " + Score + " /4 </font><br />";
}

function checkSW() {
    // Check to make sure service workers are supported in the current browser,
    // and that the current page is accessed from a secure origin. Using a
    // service worker from an insecure origin will trigger JS console errors. See
    // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
    var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
        // [::1] is the IPv6 localhost address.
        window.location.hostname === '[::1]' ||
        // 127.0.0.1/8 is considered localhost for IPv4.
        window.location.hostname.match(
            /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
        )
    );

    if ('serviceWorker' in navigator &&
        (window.location.protocol === 'https:' || isLocalhost)) {
        navigator.serviceWorker.register('js/service-worker.js')
            .then(function(registration) {
                // Check to see if there's an updated version of service-worker.js with
                // new files to cache:
                // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-registration-update-method
                if (typeof registration.update === 'function') {
                    registration.update();
                }

                // updatefound is fired if service-worker.js changes.
                registration.onupdatefound = function() {
                    // updatefound is also fired the very first time the SW is installed,
                    // and there's no need to prompt for a reload at that point.
                    // So check here to see if the page is already controlled,
                    // i.e. whether there's an existing service worker.
                    if (navigator.serviceWorker.controller) {
                        // The updatefound event implies that registration.installing is set:
                        // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
                        var installingWorker = registration.installing;

                        installingWorker.onstatechange = function() {
                            switch (installingWorker.state) {
                                case 'installed':
                                    // At this point, the old content will have been purged and the
                                    // fresh content will have been added to the cache.
                                    // It's the perfect time to display a 'New content is
                                    // available; please refresh.' message in the page's interface.
                                    break;

                                case 'redundant':
                                    throw new Error('The installing ' +
                                        'service worker became redundant.');

                                default:
                                    // Ignore
                            }
                        };
                    }
                };
            }).catch(function(e) {
                console.error('Error during service worker registration:', e);
            });
    }
}
