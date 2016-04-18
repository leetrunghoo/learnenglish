(function() {
    'use strict';

    var sideBarTpl_raw = $("#sideBarTpl").html();
    var sideBarTpl = Handlebars.compile(sideBarTpl_raw);
    var sectionTpl_raw = $("#sectionTpl").html();
    var sectionTpl = Handlebars.compile(sectionTpl_raw);

    $('.modal-trigger').leanModal({
        dismissible: true, // Modal can be dismissed by clicking outside of the modal
        opacity: .5, // Opacity of modal background
        in_duration: 300, // Transition in duration
        out_duration: 200, // Transition out duration
        ready: function() { }, // Callback for Modal open
        complete: function() { } // Callback for Modal close
    });

    $.getJSON('data/listLessons.json', function(data) {
        $('#slideNav').html(sideBarTpl(data));

        // Initialize collapse button
        $(".button-collapse").sideNav();
        // Initialize collapsible (uncomment the line below if you use the dropdown variation)
        $('.collapsible').collapsible();

        $('li.section-item').click(function() {
            var sectionIndex = $(this).index();
            var cateIndex = $(this).parents('.category-item').index();
            $('#mainContent').html(sectionTpl(data.categories[cateIndex].sections[sectionIndex]));
            // Hide sideNav
            $('.button-collapse').sideNav('hide');
        });

    });

    $(document).on('click', '.lesson-item', function() {
        var lessonIndex = $(this).data('lesson');
        console.log('lessonIndex', lessonIndex);
        $.getJSON('data/lessons/' + lessonIndex + '.json', function(lesson) {
            $('#lessonTitle').text(lesson.title);
            $('#lessonContent').html(lesson.html);
            $('#modalLesson').openModal();
        });
    });
    $(document).on('click', 'a', function(e) {
        e.preventDefault();
        if(e.target.href.indexOf('.mp3') > -1) {
            new Audio(e.target.href).play();
        }
    });



})();
