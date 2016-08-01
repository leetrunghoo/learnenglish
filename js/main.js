/* Google Analytics: change UA-XXXXX-X to be your site's ID */
var gaId = (location.href.indexOf('learnenglish.leetrunghoo') > -1) ? 'UA-73537086-2' : 'UA-73537086-1';
(function(i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function() {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
ga('create', gaId, 'auto');
ga('require', 'linkid', 'linkid.js'); // Enable enhanced link attribution in the reports
ga('send', 'pageview');

/* 
 *   using Servive Worker (sw.js)
 */
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
    navigator.serviceWorker.register('sw.js')
        .then(function(registration) {
            console.log("Service Worker Registered", registration);
            // Check to see if there's an updated version of service-worker.js with
            // new files to cache:
            // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-registration-update-method
            if (typeof registration.update === 'function') {
                console.log("Updating Service Worker");
                registration.update();
            }

            // updatefound is fired if service-worker.js changes.
            registration.onupdatefound = function() {
                // updatefound is also fired the very first time the SW is installed,
                // and there's no need to prompt for a reload at that point.
                // So check here to see if the page is already controlled,
                // i.e. whether there's an existing service worker.
                console.log('onupdatefound', navigator.serviceWorker.controller);
                if (navigator.serviceWorker.controller) {
                    // The updatefound event implies that registration.installing is set:
                    // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
                    var installingWorker = registration.installing;
                    console.log('installingWorker.state', installingWorker.state);
                    installingWorker.onstatechange = function() {
                        switch (installingWorker.state) {
                            case 'installed':
                                // At this point, the old content will have been purged and the
                                // fresh content will have been added to the cache.
                                // It's the perfect time to display a 'New content is
                                // available; please refresh.' message in the page's interface.
                                setTimeout(function() { // setTimeout to avoid message when refreshing
                                    console.log('New version is available, please refresh to update.');
                                    Materialize.toast('New version is available, please refresh to update.', 3000);
                                }, 1000);
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

// run 'gulp scripts' to set lessonsData to var 'lessonsDataJson'
var lessonsDataJson;

(function() {
    'use strict';

    // Handlebars template
    var sideBarTpl_raw = $("#sideBarTpl").html();
    var sideBarTpl = Handlebars.compile(sideBarTpl_raw);
    var sectionTpl_raw = $("#sectionTpl").html();
    var sectionTpl = Handlebars.compile(sectionTpl_raw);

    // config modal
    var modalAnimation_duration = 200;
    if (window.innerWidth <= 768) { // no animation on mobile
        modalAnimation_duration = 0;
    }
    $('.modal-trigger').leanModal({
        in_duration: modalAnimation_duration,
        out_duration: modalAnimation_duration
    });

    // load data to side bar
    $('#slideNav').html(sideBarTpl(lessonsDataJson));

    // Initialize collapse button
    $(".button-collapse").sideNav();
    // Initialize collapsible (lessons' category)
    $('.collapsible').collapsible();

    // load previous openned lesson/section
    var savedCateIndex = localStorage.getItem('cateIndex');
    var savedSectionIndex = localStorage.getItem('sectionIndex');
    var savedLessonIndex = localStorage.getItem('lessonIndex');
    var currentLessonIndex;
    if (savedCateIndex) {
        var $cateItem = $('#slideNav > .category-item:eq(' + savedCateIndex + ') > ul > li');
        $cateItem.addClass('active');
        $cateItem.find('a').addClass('active');
        $cateItem.find('.collapsible-body').show();
        if (savedSectionIndex) {
            $cateItem.find('.section-item:eq(' + savedSectionIndex + ')').addClass('selected');
            loadSection(savedCateIndex, savedSectionIndex);
            if (savedLessonIndex) {
                loadLesson(savedLessonIndex);
            }
        }
    }

    // click Section on sidebar to open list of lessons
    $('li.section-item').click(function() {
        $('.section-item').removeClass('selected');
        $(this).addClass('selected');
        $('.button-collapse').sideNav('hide'); // Hide sideNav

        var sectionIndex = $(this).index();
        var cateIndex = $(this).parents('.category-item').index();
        loadSection(cateIndex, sectionIndex);
    });

    $(document).on('click', '.lesson-item', function() {
        var lessonIndex = $(this).data('lesson');
        loadLesson(lessonIndex);
    });

    $('#btnPreviousLesson').click(function() {
        loadLesson(--currentLessonIndex);
    });

    $('#btnNextLesson').click(function() {
        loadLesson(++currentLessonIndex);
    });

    $('#btnCloseModalLesson').click(function() {
        $('#modalLesson').closeModal({
            in_duration: modalAnimation_duration,
            out_duration: modalAnimation_duration
        });
        localStorage.removeItem('lessonIndex');
        stopSpeaking();
    });

    function loadSection(cateIndex, sectionIndex) {
        localStorage.setItem('cateIndex', cateIndex);
        localStorage.setItem('sectionIndex', sectionIndex);
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
    }

    function loadLesson(lessonIndex) {
        stopSpeaking();
        $('#btnPreviousLesson').hide();
        $('#btnNextLesson').hide();

        $('#modalLesson').openModal({
            in_duration: modalAnimation_duration,
            out_duration: modalAnimation_duration
        });
        $('#lessonContent').empty();
        $('#modalLesson .modal-content').scrollTop(0);
        $.getJSON('data/lessons/' + lessonIndex + '.json', function(lesson) {
            currentLessonIndex = lessonIndex;
            localStorage.setItem('lessonIndex', lessonIndex);
            $('#lessonTitle').text(lesson.title);
            if (lessonIndex > 0) {
                $('#btnPreviousLesson').show();
            }
            var numberOfLessons = lessonsDataJson.numberOfLessons || 916;
            if (lessonIndex < numberOfLessons - 1) {
                $('#btnNextLesson').show();
            }
            // remove ad
            lesson.html = lesson.html.replace('<br><br><b>Download all the conversations</b> for your mp3 player. Hundreds of dialogs and printable lessons are available for download in the TalkEnglish Offline Package. &#xA0;Go to the <a href=\"/english-download.aspx\">English Download</a> page and download today!<br><br><br>', '');


            $('#lessonContent').html(lesson.html);
            $('#lessonContent table').each(function(i, ele) {
                if ($(this).attr('border') === '1') {
                    $(this).addClass('borderTable');
                }
            });

        });
    }

    /**
     *   Text-to-Speech & Speech-to-Text feature
     **/

    // Get the voice select element.
    var chkUseVirtual = document.getElementById("chkUseVirtual");
    var inputGroupSpeed = document.getElementById('groupSpeed');
    var selectVoice = document.getElementById('voice');

    // get/set default setting
    var useVirtualVoice = localStorage.getItem('useVirtualVoice');
    if (useVirtualVoice === 'true') {
        chkUseVirtual.checked = true;
        selectVoice.disabled = false;
        $('input[type = radio][name = groupSpeed]').attr('disabled', false);
    } else {
        chkUseVirtual.checked = false;
        localStorage.setItem('useVirtualVoice', false);
    }
    $('#chkUseVirtual').change(function() {
        localStorage.setItem('useVirtualVoice', chkUseVirtual.checked);
        if (!chkUseVirtual.checked) {
            selectVoice.disabled = true;
            $('input[type = radio][name = groupSpeed]').attr('disabled', true);
        } else {
            selectVoice.disabled = false;
            $('input[type = radio][name = groupSpeed]').attr('disabled', false);
        }
    });
    var voiceSpeedId = localStorage.getItem('voiceSpeedId') || 'rNormal';
    document.getElementById(voiceSpeedId).checked = true;
    $('input[type = radio][name = groupSpeed]').change(function() {
        voiceSpeedId = this.id;
        localStorage.setItem('voiceSpeedId', voiceSpeedId);
    });
    var voiceValue = localStorage.getItem('voiceValue') || '';
    $(selectVoice).change(function() {
        voiceValue = selectVoice.value;
        localStorage.setItem('voiceValue', selectVoice.value);
    });

    // Test whether browser supports SpeechRecognition
    window.SpeechRecognition = window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        null;
    if (window.SpeechRecognition === null) {
        console.info("This browser doesn't support Web speech API");
        // hide voice-to-text feature
        $('.listen-voice').hide();
    } else {
        window.recognizer = new window.SpeechRecognition();
        window.recognizer.continuous = false;
    }

    // create audio wo/ src
    var audioPlayer = new Audio();
    var text2Speak = '';
    audioPlayer.onloadeddata = function() {
        clearTimeout(window.timeoutCheckingNetwork);
    };
    audioPlayer.onended = function() {
        $('.playingAudio').removeClass('playingAudio');
    };
    audioPlayer.onerror = function(err) {
        // play fail => try again
        console.log('fail playing, try using Web Speech ', err);
        clearTimeout(window.timeoutCheckingNetwork);
        askToUseWebSpeech();
    };

    $('#btnPractise').click(function() {
        stopListen();
        startListen();
        $('#modalListen').openModal({
            in_duration: modalAnimation_duration,
            out_duration: modalAnimation_duration
        });
    });
    $('#btnAgain').click(function() {
        if ($(this).text() === 'Stop') {
            stopListen();
        } else { // listen again
            startListen();
        }
    });

    $('#btnCloseModalListen').click(function() {
        $('#modalListen').closeModal({
            in_duration: modalAnimation_duration,
            out_duration: modalAnimation_duration
        });
        stopListen();
    });

    // handle playing voice
    $(document).on('click', 'a', function(e) {
        if (e.target.href && e.target.href.indexOf('.mp3') > -1) {
            e.preventDefault();
            $('.playingAudio').removeClass('playingAudio');
            $(this).addClass('playingAudio');
            stopSpeaking();
            clearTimeout(window.timeoutCheckingNetwork);
            text2Speak = $(this).text();
            if (chkUseVirtual.checked) {
                // use Web Speech Api to speak
                speak(text2Speak);
            } else {
                audioPlayer.src = e.target.href;
                audioPlayer.play();
                // wait 3s for loading audio file, if it failed, try to use Web Speech
                window.timeoutCheckingNetwork = setTimeout(askToUseWebSpeech, 3000);

            }
        }
    });

    function stopSpeaking() {
        window.speechSynthesis.cancel();
        audioPlayer.pause();
    }

    // show toast that ask to use Web Speech when can't get audio file
    function askToUseWebSpeech() {
        if (!chkUseVirtual.checked) {
            console.info('Could not get the audio file, should use Web Speech instead');
            var $toastContent = $('<div>Could not get the audio file, CLICK HERE to turn on Web Speech</div>');
            $toastContent.click(function() {
                $('#toast-container').hide();
                speak(text2Speak);
                $('#chkUseVirtual').click();
            });
            $('#toast-container').show();
            Materialize.toast($toastContent, 5000);
        }
    }

    // use Web Speech Api to speak
    function speak(text) {
        // Create a new instance of SpeechSynthesisUtterance.
        var msg = new SpeechSynthesisUtterance();
        // Set the text.
        msg.text = text;
        // Set the attributes.
        msg.rate = parseFloat($('input[name="groupSpeed"]:checked').val());
        // If a voice has been selected, find the voice and set the utterance instance's voice attribute.
        if (selectVoice.value) {
            console.log(selectVoice.value);
            msg.voice = speechSynthesis.getVoices().filter(function(voice) {
                return voice.name == selectVoice.value;
            })[0];
        }
        window.speechSynthesis.speak(msg);
    }

    // use Web Speeck Api to recognize voice
    function listen(callback) {
        if (window.SpeechRecognition) {
            //fired everytime user stops speaking.
            window.recognizer.onresult = function(event) {
                if (event.results.length > 0) {
                    var text = event.results[0][0].transcript;
                    if (callback) {
                        console.log("---text recognized: " + text);
                        callback(text);
                    }
                }
            };
            //fired when recognization is stopped manually or automatically.
            window.recognizer.onend = function() {
                window.flagListening = false;
            }
            if (!window.flagListening) {
                window.recognizer.start();
                window.flagListening = true;
            }
        } else {
            console.warn("This browser doesn't support Web Speech API");
        }
    }

    function startListen() {
        $('#btnAgain').text('Stop');
        $('#recordTitle').text('Listening...');
        $('#listenResult').html('<span class="grey-text lighter-2">Speak whatever you like :D</span>');
        listen(function(text) {
            $('#recordTitle').text('Result');
            $('#listenResult').text(text);
            $('#btnAgain').text('Again');
        });
    }

    function stopListen() {
        window.recognizer.stop();
    }

    // Fetch the list of voices and populate the voice options.
    function loadVoices() {
        $(selectVoice).empty();
        // Fetch the available voices.
        var voices = speechSynthesis.getVoices();
        // Loop through each of the voices.
        voices.forEach(function(voice, i) {
            // Create a new option element.
            var option = document.createElement('option');
            // Set the options value and text.
            if (voice.lang.indexOf('en') > -1) {
                option.value = voice.name;
                option.innerHTML = voice.name + ' (' + voice.lang + ')';
                // Add the option to the voice selector.
                selectVoice.appendChild(option);
            }
        });
        // set default voice
        if (voiceValue) {
            for (var i, j = 0; i = selectVoice.options[j]; j++) {
                if (i.value == voiceValue) {
                    selectVoice.selectedIndex = j;
                    break;
                }
            }
        }
        localStorage.setItem('voiceValue', selectVoice.value);
    }
    // Execute loadVoices.
    loadVoices();

    // Chrome loads voices asynchronously.
    // window.speechSynthesis.onvoiceschanged = function(e) {
    //     loadVoices();
    // };

})();

/** 
 *   These functions for Quiz question in Listening category. The code was got from talkenglish.com
 **/
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
