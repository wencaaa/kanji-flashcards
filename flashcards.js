
'use strict';

///// State /////

var dictionary = [];

var deck = [];  // deck[0] is displayed as the current card
var flipped = false;
var n_correct = 0;
var deck_size = 0;

 // For undo purposes
var old_deck = null;  // Just copy the entire darn thing
var undo_yes = true;

///// Actions /////

function reset () {
    deck = [];
    var use_grades = [];
    for (var i = 1; i < 7; i++) {
        use_grades[i] = ($("#G" + i + ":checked").length > 0);
    }
    for (var i = 0; i < dictionary.length; i++) {
        if (use_grades[dictionary[i].grade]) {
            deck.push(dictionary[i]);
        }
    }
    deck = shuffle(deck);
    n_correct = 0;
    deck_size = deck.length;
    save_deck();
    draw();
}

function draw () {
    flipped = false;
    update_display();

}

function flip () {
    flipped = true;
    update_display();
}

function process_card (action) {
    old_deck = deck.concat();
    if (action == "10") {
        deck.splice(10, 0, deck.shift());
    }
    else if (action == "random") {
        deck.splice(5 + Math.floor(Math.random() * (deck.length - 5)), 0, deck.shift());
    }
    else if (action == "back") {
        deck.push(deck.shift());
    }
    else if (action == "remove") {
        deck.shift();
    }
    save_deck();
}

function undo () {
    if (undo_yes) n_correct -= 1;
    deck = old_deck;
    old_deck = null;
    save_deck();
    flip();
}

function yes () {
    n_correct += 1;
    undo_yes = true;
    process_card($("#on-yes").val());
    draw();
    return false;  // Prevent click from cascading to flip()
}
function no () {
    undo_yes = false;
    process_card($("#on-no").val());
    draw();
    return false;
}


///// Display /////

 // For change-optimization only
var current = null;

function update_display () {
     // Update card
    if (deck.length == 0) {
        $("#status").text("よく出来た！").removeClass("hidden");
        $("#kanji, .card-field, #everything").text("");
        current = null;
    }
    else if (deck[0].kanji != current) {
        current = deck[0].kanji;
        $("#kanji").text(deck[0].kanji);
        $("#on-yomi").html(deck[0].onyomi);
        $("#kun-yomi").html(deck[0].kunyomi);
        $("#nanori").html(deck[0].nanori);
        $("#meanings").html(deck[0].meanings);
        $("#everything").text(deck[0].everything);
        $("#status").text("");
    }
     // Select which fields are visible
    function show_if_checked (elem, check) {
        if ($(check)[0].checked) {
            $(elem).removeClass("hidden");
        }
        else {
            $(elem).addClass("hidden");
        }
    }
    if (!flipped) {  // front
        show_if_checked("#kanji", "#front-kanji");
        show_if_checked("#on-yomi", "#front-on-yomi");
        show_if_checked("#kun-yomi", "#front-kun-yomi");
        show_if_checked("#nanori", "#front-nanori");
        show_if_checked("#meanings", "#front-meanings");
        show_if_checked("#everything", "#front-everything");
        $("#buttons").addClass("hidden");
        $("#screen").addClass("clickable");
    }
    else {  // back
        show_if_checked("#kanji", "#back-kanji");
        show_if_checked("#on-yomi", "#back-on-yomi");
        show_if_checked("#kun-yomi", "#back-kun-yomi");
        show_if_checked("#nanori", "#back-nanori");
        show_if_checked("#meanings", "#back-meanings");
        show_if_checked("#everything", "#back-everything");
        $("#buttons").removeClass("hidden");
        $("#screen").removeClass("clickable");
    }
    if (old_deck != null) {
        var symbol = undo_yes ? "○" : "×";
        $("#undo").text("Undo " + symbol + " " + old_deck[0].kanji)[0].disabled = false;
    }
    else {
        $("#undo").text("Can't undo")[0].disabled = true;
    }
    $("#count").text(n_correct + "/" + deck_size);
}


///// Web Storage /////

function save_deck () {
    if (window.localStorage) {
        var deck_s;
        for (var i = 0; i < deck.length; i++) {
            deck_s += deck[i].kanji;
        }
        localStorage.setItem("kanji-flashcards.deck", deck_s);
        localStorage.setItem("kanji-flashcards.n_correct", n_correct);
        localStorage.setItem("kanji-flashcards.deck_size", deck_size);
    }
}
function load_deck () {
    if (window.localStorage) {
        var deck_s = localStorage.getItem("kanji-flashcards.deck");
        for (var i = 0; i < deck_s.length; i++) {
             // This could be made more time-efficient.
            for (var j = 0; j < dictionary.length; j++) {
                if (dictionary[j].kanji == deck_s[i]) {
                    deck.push(dictionary[j]);
                }
            }
        }
        n_correct = parseInt(localStorage.getItem("kanji-flashcards.n_correct"));
        deck_size = parseInt(localStorage.getItem("kanji-flashcards.deck_size"));
    }
}

function save_settings () {
    if (window.localStorage) {
        var front = "";
        if ($("#front-kanji")[0].checked) front += " kanji";
        if ($("#front-on-yomi")[0].checked) front += " on-yomi";
        if ($("#front-kun-yomi")[0].checked) front += " kun-yomi";
        if ($("#front-nanori")[0].checked) front += " nanori";
        if ($("#front-meanings")[0].checked) front += " meanings";
        if ($("#front-everything")[0].checked) front += " everything";
        localStorage.setItem("kanji-flashcards.show-front", front);
        var back = "";
        if ($("#back-kanji")[0].checked) back += " kanji";
        if ($("#back-on-yomi")[0].checked) back += " on-yomi";
        if ($("#back-kun-yomi")[0].checked) back += " kun-yomi";
        if ($("#back-nanori")[0].checked) back += " nanori";
        if ($("#back-meanings")[0].checked) back += " meanings";
        if ($("#back-everything")[0].checked) back += " everything";
        localStorage.setItem("kanji-flashcards.show-back", back);
        var theme = $("#theme-select").val();
        localStorage.setItem("kanji-flashcards.theme", theme);
        var font = $("#font-select").val();
        localStorage.setItem("kanji-flashcards.font", font);
        var actions = $("#on-no").val() + " " + $("#on-yes").val();
        localStorage.setItem("kanji-flashcards.actions", actions);
    }
}
function load_settings () {
    if (window.localStorage) {
        var front = localStorage.getItem("kanji-flashcards.show-front");
        if (front) {
            $("#front-kanji")[0].checked = !!front.match(/\bkanji\b/);
            $("#front-on-yomi")[0].checked = !!front.match(/\bon-yomi\b/);
            $("#front-kun-yomi")[0].checked = !!front.match(/\bkun-yomi\b/);
            $("#front-nanori")[0].checked = !!front.match(/\bnanori\b/);
            $("#front-meanings")[0].checked = !!front.match(/\bmeanings\b/);
            $("#front-everything")[0].checked = !!front.match(/\beverything\b/);
        }
        var back = localStorage.getItem("kanji-flashcards.show-back");
        if (back) {
            $("#back-kanji")[0].checked = !!back.match(/\bkanji\b/);
            $("#back-on-yomi")[0].checked = !!back.match(/\bon-yomi\b/);
            $("#back-kun-yomi")[0].checked = !!back.match(/\bkun-yomi\b/);
            $("#back-nanori")[0].checked = !!back.match(/\bnanori\b/);
            $("#back-meanings")[0].checked = !!back.match(/\bmeanings\b/);
            $("#back-everything")[0].checked = !!back.match(/\beverything\b/);
        }
        var theme = localStorage.getItem("kanji-flashcards.theme");
        if (theme && valid_theme(theme)) {
            $("#theme-select").val(theme);
        }
        var font = localStorage.getItem("kanji-flashcards.font")
        if (font && valid_font(font)) {
            $("#font-select").val(font);
        }
        var actions = localStorage.getItem("kanji-flashcards.actions");
        if (actions) {
            var match = actions.match(/^(10|random|back) (random|back|remove)$/);
            if (match[1]) $("#on-no").val(match[1]);
            if (match[2]) $("#on-yes").val(match[2]);
        }
    }
}


///// Style /////

function valid_theme (theme) {
    return theme.match(/^(?:paper|deepforest)$/);
}
function valid_font (font) {
    return font.match(/^(?:gothic|mincho)$/);
}

function update_style () {
    var theme = $("#theme-select").val();
    if (!valid_theme(theme))
        theme = "paper";
    var font = $("#font-select").val();
    if (!valid_font(font))
        font = "gothic";
    $("body").attr("class", "theme-" + theme + " font-" + font);
}


///// Init /////

$(document).ready(function(){
    load_settings();
    update_style();
    $("#status").text("Loading dictionary...");
    $.ajax({
        url: "kanjidic.1-6",
        mimeType: "text/plain; charset=UTF-8",
        dataType: "text",
        success: initialize,
        error: function (jqXHR, stat, mess) {
            $("#status").text("Failed to load dictionary: " + stat + "; " + mess);
        }
    });
});

function initialize (data) {
     // Load dictionary
    $("#status").text("Initializing dictionary...");
    var matches = data.match(/..*/g);
    for (var i = 0; i < matches.length; i++) {
        var line = matches[i];
        if (line[0] == '#') continue;
        var pre_names_m = line.match(/(?:(?! T1).)*/);
        var names_m = line.match(/ T[^{]*/);
        var grade_m = line.match(/\bG[0-9]+\b/);
        var unicode_m = line.match(/\bU[0-9a-f]+\b/);

        var onyomi = span_join(line.match(/-?[ァ-ヺ][.ァ-ヺ]*-?/g), "　");
        var kunyomi = pre_names_m[0].match(/-?[ぁ-ゖ][.ぁ-ゖ]*-?/g);
        if (kunyomi != null) {
            for (var j = 0; j < kunyomi.length; j++) {
                kunyomi[j] = kunyomi[j].replace(/\.(.*)$/, "<span class=\"okurigana\">$1</span>");
            }
        }
        kunyomi = span_join(kunyomi, "　");

        var nanori = names_m == null ? null : names_m[0].match(/-?[ぁ-ゖ][.ぁ-ゖ]*-?/g);
        nanori = span_join(nanori, "　");
        if (nanori != "") nanori = "（" + nanori + "）";

        var meanings = line.match(/\{[^}]+\}/g);
        if (meanings != null) {
            for (var j = 0; j < meanings.length; j++) {
                meanings[j] = meanings[j].slice(1, -1);
            }
        }
        meanings = span_join(meanings, ", ");

        dictionary.push({
            kanji: line[0],
            grade: grade_m == null ? 0 : parseInt(grade_m[0].slice(1)),
            unicode: unicode_m[0].slice(1),
            onyomi: onyomi,
            kunyomi: kunyomi,
            nanori: nanori,
            meanings: meanings,
            everything: line
        });
    }
     // Register event handlers
    $("#no").click(no);
    $("#yes").click(yes);
    $("#screen").click(flip);  // Click anywhere except #control to flip
    $("#control").click(function(event){ event.stopPropagation(); });
    $("#reset").click(reset);
    $("#undo").click(undo);
    $("#settings-show input").change(function(){ save_settings(); update_display(); });
    $("#settings-style select").change(function(){ save_settings(); update_style(); });
    $("#settings-actions select").change(save_settings);
    $("#status").text("Everything's ready.").addClass("hidden");
    $(document).keydown(function(e){
        if (e.which == 13 || e.which == 32) {
            flip();
        }
        else if (e.which == 67 || e.which == 89 || e.which == 79) {
            yes();
        }
        else if (e.which == 69 || e.which == 78 || e.which == 88) {
            no();
        }
    });
    if (window.localStorage && localStorage.getItem("kanji-flashcards.deck")) {
        load_deck();
        draw();
    }
    else {
        reset();
    }
}


///// Utilities /////

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function span_join (list, sep) {
    if (list == null) return "";
    else return "<span>" + list.join("</span>" + sep + "<span>") + "</span>";
}

