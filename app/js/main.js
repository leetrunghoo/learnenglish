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

    $('.modal-trigger').leanModal({
        dismissible: true, // Modal can be dismissed by clicking outside of the modal
        opacity: .5, // Opacity of modal background
        in_duration: 300, // Transition in duration
        out_duration: 200, // Transition out duration
        ready: function() { // Callback for Modal open
        },
        complete: function() { // Callback for Modal close
            audioPlayer.pause();
        }
    });

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
            $('#mainContent').html(sectionTpl(data.categories[cateIndex].sections[sectionIndex]));
            $('.masonry').masonry({
                // use outer width of grid-sizer for columnWidth
                itemSelector: '.grid-item',
                // do not use .grid-sizer in layout
                columnWidth: '.grid-sizer',
                percentPosition: true
            });
        });
        $('li.section-item:nth-child(10)').click()
    });

    $(document).on('click', '.lesson-item', function() {
        var lessonIndex = $(this).data('lesson');
        $.getJSON('data/lessons/' + lessonIndex + '.json', function(lesson) {
            $('#lessonTitle').text(lesson.title);
            $('#lessonContent').html(lesson.html);
            $('#modalLesson').openModal();
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
