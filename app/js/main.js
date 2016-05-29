// run 'gulp scripts' to set lessonsData to lessonsDataJson
var lessonsDataJson;

(function() {
    'use strict';

    var sideBarTpl_raw = $("#sideBarTpl").html();
    var sideBarTpl = Handlebars.compile(sideBarTpl_raw);
    var sectionTpl_raw = $("#sectionTpl").html();
    var sectionTpl = Handlebars.compile(sectionTpl_raw);

    var audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.onended = function() {
        $('.playingAudio').removeClass('playingAudio');
    };

    // http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';
    // At least Safari 3+: "[object HTMLElementConstructor]"
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/ false || !!document.documentMode;
    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;
    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;
    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;
    window.browser = {
        isOpera: isOpera,
        isFirefox: isFirefox,
        isSafari: isSafari,
        isIE: isIE,
        isEdge: isEdge,
        isChrome: isChrome,
        isBlink: isBlink,
    };

    var modalAnimation_duration = 0;
    if (browser.isOpera || browser.isFirefox || browser.isSafari || browser.isEdge || browser.isChrome || browser.isBlink) {
        modalAnimation_duration = 200;
    }
    $('.modal-trigger').leanModal({
        in_duration: modalAnimation_duration,
        out_duration: modalAnimation_duration
    });

    $('#slideNav').html(sideBarTpl(lessonsDataJson));

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
        var sectionData = lessonsDataJson.categories[cateIndex].sections[sectionIndex];
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

    $(document).on('click', '.lesson-item', function() {
        $('#modalLesson').openModal({
            in_duration: modalAnimation_duration,
            out_duration: modalAnimation_duration,
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
            $('#lessonContent table').each(function(i, ele) {
                if ($(this).attr('border') === '1') {
                    $(this).addClass('borderTable');
                }
            });
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
    if (document.getElementById(elementid).style.display == 'none') {
        document.getElementById(elementid).style.display = '';
    } else {
        document.getElementById(elementid).style.display = 'none';
    }
}

function CheckScore() {
    var Ques1UserAnswer, Ques2UserAnswer, Ques3UserAnswer, Ques4UserAnswer;
    for (var i = 0; i < 4; i++) {
        if (MyForm.Question1[i].checked) {
            Ques1UserAnswer = MyForm.Question1[i].value;
        }
        if (MyForm.Question2[i].checked) {
            Ques2UserAnswer = MyForm.Question2[i].value;
        }
        if (MyForm.Question3[i].checked) {
            Ques3UserAnswer = MyForm.Question3[i].value;
        }
        if (MyForm.Question4[i].checked) {
            Ques4UserAnswer = MyForm.Question4[i].value;
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
