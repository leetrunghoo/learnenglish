// run 'gulp scripts' to set lessonsData to var 'lessonsDataJson'
var lessonsDataJson;

(function() {
    'use strict';

    // Handlebars template
    var sideBarTpl_raw = $("#sideBarTpl").html();
    var sideBarTpl = Handlebars.compile(sideBarTpl_raw);
    var sectionTpl_raw = $("#sectionTpl").html();
    var sectionTpl = Handlebars.compile(sectionTpl_raw);
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
        localStorage.setItem('voiceValue', selectVoice.value);
    });

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
    // click Section on sidebar to open list of lessons
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
    // $('li.section-item:nth-child(10)').click() // for testing UI

    $(document).on('click', '.lesson-item', function() {
        $('#modalLesson').openModal({
            in_duration: modalAnimation_duration,
            out_duration: modalAnimation_duration,
            complete: function() { // Callback for Modal close
                stopSpeaking();
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

    // create audio wo/ src
    var audioPlayer = new Audio();
    var text2Speak = '';
    var timeoutCheckingNetwork;
    audioPlayer.onloadeddata = function() {
        clearTimeout(timeoutCheckingNetwork);
    };
    audioPlayer.onended = function() {
        $('.playingAudio').removeClass('playingAudio');
    };
    audioPlayer.onerror = function(err) {
        // play fail => try again
        console.log('fail playing, try using Web Speech ', err);
    };

    // handle playing voice
    $(document).on('click', 'a', function(e) {
        if (e.target.href && e.target.href.indexOf('.mp3') > -1) {
            e.preventDefault();
            $('.playingAudio').removeClass('playingAudio');
            $(this).addClass('playingAudio');
            stopSpeaking();
            clearTimeout(timeoutCheckingNetwork);
            text2Speak = $(this).text();
            if (chkUseVirtual.checked) {
                // use Web Speech Api to speak
                speak(text2Speak);
            } else {
                audioPlayer.src = e.target.href;
                audioPlayer.play();
                // wait 3s for loading audio file, if it failed, try to use Web Speech
                timeoutCheckingNetwork = setTimeout(function() {
                    if (!chkUseVirtual.checked) {
                        console.info('Could not get the audio file, should use Web Speech instead');
                        var $toastContent = $('<div>Could not get the audio file, CLICK HERE to turn on Web Speech</div>');
                        $toastContent.click(function() {
                            speak(text2Speak);
                            $('#chkUseVirtual').click();
                        });
                        Materialize.toast($toastContent, 5000);
                    }
                }, 3000);

            }
        }
    });

    function stopSpeaking() {
        window.speechSynthesis.cancel();
        audioPlayer.pause();
    }


    // Test whether browser supports Web Speech API
    window.SpeechRecognition = window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        null;
    if (window.SpeechRecognition === null) {
        console.info("This browser doesn't support Web speech API");
    } else {
        window.recognizer = new window.SpeechRecognition();
    }
    // use Web Speeck Api to speak
    function speak(text) {
        // Create a new instance of SpeechSynthesisUtterance.
        var msg = new SpeechSynthesisUtterance();
        // Set the text.
        msg.text = text;
        // Set the attributes.
        msg.rate = parseFloat($('input[name="groupSpeed"]:checked').val());
        // If a voice has been selected, find the voice and set the utterance instance's voice attribute.
        if (selectVoice.value) {
            msg.voice = speechSynthesis.getVoices().filter(function(voice) {
                return voice.name == selectVoice.value;
            })[0];
        }
        window.speechSynthesis.speak(msg);
    }

    // use Web Speeck Api to recognize voice
    function listen(callback) {
        if (window.SpeechRecognition) {
            window.recognizer.onresult = function(event) {
                if (event.results.length > 0) {
                    console.log('recognize:', event.results);
                    var text = event.results[0][0].transcript;
                    if (callback) {
                        console.log("---------------text recognized: " + text);
                        callback(text);
                    }
                }
            };
            window.recognizer.start();
        } else {
            console.warn("This browser doesn't support Web Speech API");
        }
    }

    // Fetch the list of voices and populate the voice options.
    function loadVoices() {
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
    window.speechSynthesis.onvoiceschanged = function(e) {
        loadVoices();
    };

})();


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
