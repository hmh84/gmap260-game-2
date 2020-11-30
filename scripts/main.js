// =========================
// GENERAL FUNCTIONS
// =========================

const docQ = document.querySelector.bind(document),
    docQA = document.querySelectorAll.bind(document);

function random_chance(chance) {
    // Chance param is a decimal
    // 70% chance ... random_chance(.7);
    // 20% chance ... random_chance(.2);
    const x = Math.random().toFixed(2);
    if (x <= chance) {
        return true;
    } else {
        return false;
    }
}

function random_min_max(min, max) {
    return min + Math.random() * (max - min).toFixed(2);
}

function random_int(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function num_with_commas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function num_format(num) {
    if (num >= 1000000000000) {
        return (num / 1000000000000).toFixed(2).replace(/\.0$/, '') + ' T';
    }
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2).replace(/\.0$/, '') + ' B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2).replace(/\.0$/, '') + ' M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2).replace(/\.0$/, '') + ' K';
    }
    return num;
}

const modal = docQ('#modal'),
    all_modals = document.querySelectorAll('.modal_common'),
    close_modal = document.querySelectorAll('.close_modal');

function toggle_modal(new_modal) {
    modal.classList.add('modal_open');
    all_modals.forEach(modal => {
        modal.style.display = 'none';
    });
    if (new_modal === 'close') {
        modal.classList.remove('modal_open');
    } else {
        document.querySelector(`#${new_modal}`).style.display = 'flex';
    }
}

const all_buttons = docQA('button');
function toggle_loading(state) { // Show or Hide the loading animation
    // Param 'state' must either be 'start' or 'stop'
    const loading = docQ('#loading');

    if (state === 'start') { // While something is loading
        loading.style.display = 'flex';
        // Disable all buttons
        all_buttons.forEach(button => {
            if (!button.classList.contains('spend')) {
                button.disabled = true;
            }
        });
    } else { // When finished
        loading.style.display = 'none';
        // Enable all buttons
        all_buttons.forEach(button => {
            if (!button.classList.contains('spend')) {
                button.disabled = false;
            }
        });
    }
}

function get_player_obj(name) {
    const country = countries.find(element => element.name === name);
    return country;
}

function get_player_index(name) { // Sets player order, does not change
    for (var i = 0; i < countries.length; i++) {
        if (countries[i].name === name) {
            return i;
        }
    }
}

// =========================
// LOGIN & ROLES
// =========================

intro_close_button = docQ('#intro_close_button');
intro_close_button.addEventListener('click', () => {
    toggle_modal('modal_login');
    play_tone('bgm');
})

const login_button = docQ('#login_button'),
    session_input = docQ('#session_input'),
    role_input = docQ('#role_input'),
    player_input = docQ('#player_input');

function route_user() { // Determines user routing for host vs. players
    if (role_input.value && session_input.value && player_input.value) {
        update_login_stats(player_input.value);
        role_input.value === 'host' ? init_host() : init_player();
        setup_turn_order();
    } else {
        alert('You must select all options before proceeding.');
    }
}

login_button.addEventListener('click', route_user);

// Next Player
var next_player;
function setup_turn_order() { // Sets player order, does not change
    for (var i = 0; i < countries.length; i++) {
        if (countries[i].name === current_player) {
            i === countries.length - 1 ? next_player = countries[0].name : next_player = countries[i + 1].name;
        }
    }
}

// =========================
// ALL ROLES SETUP
// =========================

function init_common() { // Functions to call for all roles
    unsub_all();
    build_scoreboard();
    add_sync_sub();
    add_stat_subs();
    add_next_player_sub();
    add_global_cure_sub();
    countries.forEach(country => { // Updates UI for ALL countries
        ui_update_stats(country.name);
    });
}

function unlock_game() {
    // This is really where the game begins for all players
    // From here we can allow interactions to take place
    // This gets called when the host begins the game
    toggle_modal('close');
    console.log('Game is starting');
    hud.classList.add('hud_open');
    toggle_loading('stop');
}

// =========================
// HOST ROLE SETUP
// =========================

const begin_button = docQ('#begin_button'),
    reset_buttons = docQA('.reset_button');
begin_button.addEventListener('click', start_game);
reset_buttons.forEach(button => {
    button.addEventListener('click', init_host);
});

function init_host() { // Functions specific to host role
    toggle_modal('modal_host_controls');
    reset_game();
    init_common();
}

function reset_game() { // Default all values in Firebase
    toggle_loading('start');
    countries.forEach(country => {
        const docRef = db.collection('sessions').doc(current_session).collection('players').doc(country.name),
            defaultsRef = country.defaults,
            currentsRef = country.currents,

            data = { // Create data
                budget: defaultsRef.budget / 5,
                research_speed: currentsRef.research_speed,
                coop: currentsRef.coop,
                infection_rate: currentsRef.infection_rate,
                masks: currentsRef.masks,
                healthy: currentsRef.healthy,
                infected: currentsRef.infected,
                dead: currentsRef.dead,
                origin: false,
            };

        docRef.set(data).then(function () { // Push data to DB
            console.log('Reset Country Stat');
            // set_pandemic_origin();
            toggle_loading('stop');
        }).catch(function (error) {
            console.error(error);
        });
    });
    const docRef = db.collection('sessions').doc(current_session).collection('global_stats').doc('cure_progress'),
        unique_ID = db.collection('sessions').doc().id,
        data = { // Create data
            cure_progress: 0,
            update_sync: unique_ID,
        };

    docRef.set(data).then(function () { // Push data to DB
        console.log('Reset Global Cure Progress');
    }).catch(function (error) {
        console.error(error);
    });
}

function set_pandemic_origin() {
    const index = random_int(3),
        docRef = db.collection('sessions').doc(current_session).collection('players').doc(countries[index].name),
        data = { // Create data
            origin: true,
        };
    docRef.update(data).then(function () { // Push data to DB
        console.log('Reset Country Stat');
        toggle_loading('stop');
    }).catch(function (error) {
        console.error(error);
    });
}

function start_game() { // Starts the game for all players
    toggle_loading('start');
    docRef = db.collection('sessions').doc(current_session);

    const unique_ID = db.collection('sessions').doc().id,
        data = { // Create data
            update_sync: unique_ID,
        };

    setTimeout(function () {
        // I am delayed
        docRef.update(data).then(function () { // Push data to DB
            console.log('Syncing Game');
            push_next_player();
        }).catch(function (error) {
            console.error(error);
        });
    }, 1000);
}

// =========================
// PLAYER ROLE SETUP
// =========================

function init_player() {  // Functions specific to player role
    toggle_modal('modal_waiting_room');
    init_common();
    reset_buttons.forEach(button => {
        button.remove();
    });
}

// =========================
// FIREBASE SUBSCRIPTIONS
// =========================

let subscriptions = [];

// Game Start/Reset
function add_sync_sub() {
    var snap_count = 0;
    const docRef = db.collection('sessions').doc(current_session),
        sub = docRef.onSnapshot(function (doc) { // When an update occurs...
            snap_count++;
            if (snap_count > 1) { // After the default snapshot...
                setTimeout(function () {
                    // I am delayed
                    docRef.get().then(function (doc) {
                        // Unlock the game for all players
                        unlock_game();
                    }).catch(function (error) {
                        console.log('Error getting document:', error);
                    });
                }, 1000);
            }
        });
    subscriptions.push(sub); // Add subscription to subscriptions array
}

// Turn Updates
function add_next_player_sub() { // Adds Firebase snapshot listeners for the next turn
    var snap_count = 0;
    const docRef = db.collection('sessions').doc(current_session).collection('global_stats').doc('next_player'),
        sub = docRef.onSnapshot(function (doc) { // When an update occurs...
            snap_count++;
            if (snap_count > 1) { // After the default snapshot...
                setTimeout(function () {
                    // I am delayed
                    docRef.get().then(function (doc) {
                        // Make quickRef variables
                        const result = doc.data();
                        if (result.next_player === current_player) {
                            begin_turn();
                        } else {
                            turn_stat.innerText = `${result.next_player} is taking their turn...`;
                            event_card.style.backgroundImage = '';
                            event_card.innerText = 'Wait for your turn to receive a card...';
                        }
                    }).catch(function (error) {
                        console.log('Error getting document:', error);
                    });
                }, 1000);
            }
        });
    subscriptions.push(sub); // Add subscription to subscriptions array
}

// Stat Updates
function add_stat_subs() { // Adds Firebase snapshot listeners for country stat updates
    countries.forEach(country => {
        var snap_count = 0;
        if (country.name == current_player) { // Add sub to everyone except yourself
            // [Need to figure out proper negation logic]
        } else {
            const docRef = db.collection('sessions').doc(current_session).collection('players').doc(country.name),
                sub = docRef.onSnapshot(function (doc) { // When an update occurs...
                    snap_count++;
                    if (snap_count > 1) { // After the default snapshot...
                        docRef.get().then(function (doc) {
                            // Make quickRef variables
                            const result = doc.data(),
                                index = get_player_index(country.name),
                                currentsRef = countries[index].currents;

                            // Update the 'current' part of the array obj
                            currentsRef.budget = result.budget;
                            currentsRef.healthy = result.healthy;
                            currentsRef.infected = result.infected;
                            currentsRef.dead = result.dead;
                            currentsRef.research_speed = result.research_speed.toFixed(2);
                            currentsRef.infection_rate = result.infection_rate.toFixed(2);
                            currentsRef.coop = result.coop.toFixed(2);
                            currentsRef.masks = result.masks.toFixed(2);
                            currentsRef.origin = result.origin;
                            console.log(country.name + ' origin?: ' + currentsRef.origin);

                            ui_update_stats(country.name);

                        }).catch(function (error) {
                            console.log('Error getting document:', error);
                        });
                    }
                });
            subscriptions.push(sub); // Add subscription to subscriptions array
        }
    });
}

// Global Cure Progress
function add_global_cure_sub() { // Adds Firebase snapshot listeners for global cure progress updates
    var snap_count = 0;
    const docRef = db.collection('sessions').doc(current_session).collection('global_stats').doc('cure_progress'),
        sub = docRef.onSnapshot(function (doc) { // When an update occurs...
            snap_count++;
            if (snap_count > 1) { // After the default snapshot...
                docRef.get().then(function (doc) {
                    // Make quickRef variables
                    const result = doc.data();

                    // Update the 'current' part of the array obj
                    global_cure = result.cure_progress;

                    ui_update_global_cure();

                }).catch(function (error) {
                    console.log('Error getting document:', error);
                });
            }
        });
    subscriptions.push(sub); // Add subscription to subscriptions array
}

// Unsubscribe function
function unsub_all() { // Unsubscribes all Firebase snapshot listeners
    subscriptions.forEach(sub => {
        // Calling the sub itself as a function will unsubscribe it per Firebase syntax
        sub();
    });
}

// =========================
// UI STATS
// =========================

// Current Player Stat
var current_player,
    current_session;
const current_player_stat = docQ('#current_player_stat'),
    document_title = docQ('title'),
    player_login_status = docQ('#player_login_status'),
    host_login_status = docQ('#host_login_status'),
    hud = docQ('#hud');
function update_login_stats(value) { // Updates the UI to reflect your chosen player
    current_player = value;
    current_session = session_input.value;
    document_title.innerText = `Pandemic Simulator - Room #${current_session}`;
    player_login_status.innerText = `Playing as ${current_player} in Room #${current_session}`;
    host_login_status.innerText = `Hosting Room #${current_session}, playing as ${current_player}`;
    current_player_stat.innerText = value;
}

// Slider
const slider = docQ('#slider'),
    slider_val_left = docQ('#slider_val_left'),
    slider_val_right = docQ('#slider_val_right');
var c_budget, r_budget;

function update_slider_val() {
    const index = get_player_index(current_player),
        currentsRef = countries[index].currents; // Currents object

    slider.max = currentsRef.budget; // Set's max budget for the slider

    r_budget = slider.max - slider.value;
    c_budget = slider.value;

    slider_val_left.innerText = 'Event: $' + num_format(r_budget);
    slider_val_right.innerText = 'Cure: $' + num_format(c_budget);
}

slider.addEventListener('input', update_slider_val);

// UI Stats
const healthy_stat = docQ('#healthy_stat'),
    infected_stat = docQ('#infected_stat'),
    dead_stat = docQ('#dead_stat'),
    masks_stat = docQ('#masks_stat'),
    coop_stat = docQ('#coop_stat'),
    budget_stat = docQ('#budget_stat'),
    research_speed_stat = docQ('#research_speed_stat'),
    infection_rate_stat = docQ('#infection_rate_stat'),
    cure_progress_stat = docQ('#cure_progress_stat');

function ui_update_stats(target) { // Updates UI and checks for win/loss
    // Param 'Target' is a string of the country name

    // Get your country
    const country = get_player_obj(target),
        // Get the array stats (as integers)
        budget = num_format(country.currents.budget),
        healthy = country.currents.healthy,
        infected = country.currents.infected,
        dead = country.currents.dead,
        ttl_population = healthy + infected + dead,
        masks = country.currents.masks,
        coop = country.currents.coop,
        research_speed = country.currents.research_speed,
        infection_rate = country.currents.infection_rate,

        // As percentages (these are just strings, do not calculate with them)
        p_dead = ((dead / ttl_population) * 100).toFixed(2) + '%',
        p_infected = ((infected / ttl_population) * 100).toFixed(2) + '%',
        p_healthy = (((ttl_population - infected - dead) / ttl_population) * 100).toFixed(2) + '%',
        p_masks = masks.toFixed(2) + '%',
        p_coop = coop.toFixed(2) + '%',
        p_research_speed = research_speed.toFixed(2) + '%',
        p_infection_rate = infection_rate.toFixed(2) + '%';

    // Rounded UI %'s
    const ui_p_dead = Math.round(((dead / ttl_population) * 100)) + '%',
        ui_p_infected = Math.round(((infected / ttl_population) * 100)) + '%',
        ui_p_healthy = Math.round((((ttl_population - infected - dead) / ttl_population) * 100)) + '%',
        ui_p_masks = Math.round(masks) + '%',
        ui_p_coop = Math.round(coop) + '%',
        ui_p_research_speed = Math.round(research_speed) + '%',
        ui_p_infection_rate = Math.round(infection_rate) + '%';

    if (country.name == current_player) { // Your user
        // Display array stats
        healthy_stat.style.width = ui_p_healthy;
        infected_stat.style.width = ui_p_infected;
        dead_stat.style.width = ui_p_dead;
        masks_stat.innerText = ui_p_masks;
        coop_stat.innerText = ui_p_coop;
        research_speed_stat.innerText = ui_p_research_speed;
        infection_rate_stat.innerText = ui_p_infection_rate;
        budget_stat.innerText = `$${budget}`;

    } else {  // Only applies to end users
        docQ(`#score_healthy_${country.name}`).style.width = p_healthy;
        docQ(`#score_infected_${country.name}`).style.width = p_infected;
        docQ(`#score_dead_${country.name}`).style.width = p_dead;
    }

    // Color the country on the map with infection rate
    docQ(`[data-country="${country.name}"]`).style.opacity = .3 + (parseFloat(p_infected) / 100.0);

    check_for_win_or_loss(ttl_population, global_cure, infected, dead);
}

function ui_update_global_cure() {
    // Cure progress stat
    cure_progress_stat.style.width = `${global_cure.toFixed(2)}%`;
    cure_progress_stat.innerText = `${global_cure.toFixed(2)}%`;
}

function check_for_win_or_loss(ttl_population, global_cure, infected, dead) { // Win & Loss Conditions
    // Win Conditions
    if (global_cure >= 100) {
        end_the_game('win'); // Check if 100%+ Cure Progress
    }
    // Loss Conditions
    if (infected >= ttl_population * .7 || dead >= ttl_population * .4) {
        end_the_game('loss');
    }
}

// =========================
// TURNS
// =========================

var turn_int;
const time_stat = docQ('#time_stat');

function begin_turn() {
    spend_resource_button.disabled = false;
    update_turn_stat();
    add_turn_budget();
    present_challenge();

    var turn_time;
    if (current_turn > 0 && current_turn <= 5) {
        turn_time = 30000;
    } else if (current_turn > 5 && current_turn <= 10) {
        turn_time = 15000;
    } else if (current_turn > 10 && current_turn <= 15) {
        turn_time = 10000;
    } else if (current_turn > 15 && current_turn <= 20) {
        turn_time = 6000;
    } else {
        turn_time = 4000;
    }

    turn_int = setInterval(function () {
        turn_time = turn_time - 1000;
        time_stat.innerText = (turn_time / 1000) + 's';
        if (turn_time == 3 || turn_time == 2 || turn_time == 1) {
            // play_tone('beep_1');
        }
        if (turn_time <= 0) {
            // play_tone('beep_0');
            end_turn(); // End Turn
            clearInterval(turn_int); // Clear Interval
        }
    }, 1000);
}

const turn_stat = docQ('#turn_stat');

function update_turn_stat() {
    current_turn++; // Increase current_turn by one
    turn_stat.innerText = `Turn #${current_turn}`; // Display it
}

function add_turn_budget() {
    if (current_turn > 1) { // Turn 2+
        const index = get_player_index(current_player),
            defaultsRef = countries[index].defaults, // Defaults object
            currentsRef = countries[index].currents; // Currents object

        currentsRef.budget = currentsRef.budget + (defaultsRef.budget / 5);
    }
    update_slider_val();
}

function update_player_stats() { // Stat changes, does not include budget
    // Make quickRef variables
    const index = get_player_index(current_player),
        defaultsRef = countries[index].defaults, // Defaults object
        currentsRef = countries[index].currents; // Currents object

    // ===== Update Cure Progress ===== //

    if (slider.value > currentsRef.budget) { // Limit spending
        update_cure_progress(currentsRef.budget);
        currentsRef.budget = 0;
    } else { // Spend full amount
        currentsRef.budget = currentsRef.budget - c_budget; // Spend budget
        update_cure_progress(c_budget);
    }

    function update_cure_progress(funding) {
        const development_chance = 6,
            budget_multiplier = 7000000000, //How much money equates to '1' point of development
            progress = ((funding / budget_multiplier) * (Math.random(4.5, development_chance) / 10).toFixed(2) * currentsRef.research_speed);

        global_cure += progress;
    }

    // ===== Update Infection Rate ===== //

    const portion = .02;
    currentsRef.infected += (currentsRef.infected * (currentsRef.infection_rate + Math.random(-(currentsRef.healthy * portion), (currentsRef.healthy * portion))));

    // const new_cases = Math.round((currentsRef.healthy * currentsRef.infection_rate));

    // currentsRef.infected += new_cases;
    // currentsRef.healthy -= new_cases;

    // ===== Push Changes to the DB ===== //

    push_current_stats();
}

const spend_resource_button = docQ('#spend_resource_button');
spend_resource_button.addEventListener('click', () => {
    // Make quickRef variables
    const index = get_player_index(current_player),
        defaultsRef = countries[index].defaults, // Defaults object
        currentsRef = countries[index].currents, // Currents object

        // Make END function string
        fn_string = 'event_end_' + (current_event.replace(/ /g, "_")),
        fn_params = [defaultsRef, currentsRef];
    console.log(fn_string);
    // Find it
    const fn = window[fn_string];
    // Validate & run it
    if (typeof fn === "function") fn.apply(null, fn_params);

    // End of turn
    end_turn();
})

function end_turn() {
    update_player_stats();
    push_next_player();
    clearInterval(turn_int);
    time_stat.innerText = '';
    event_card.innerText = 'Wait for your turn to receive a card...';
    event_card.style.backgroundImage = '';
    turn_stat.innerText = `${next_player} is taking their turn...`;
    spend_resource_button.disabled = true;
    // Idea: Display what challenge they are facing??
}

function push_next_player() { // Signals the next turn
    toggle_loading('start');
    const docRef = db.collection('sessions').doc(current_session).collection('global_stats').doc('next_player'),
        unique_ID = db.collection('sessions').doc().id,
        data = { // Create data
            next_player: next_player,
            update_sync: unique_ID,
        };
    docRef.set(data).then(function () { // Push data to DB
        toggle_loading('stop');
    }).catch(function (error) {
        console.error(error);
    });
}

function push_current_stats() { // Pushes all current local client stats to DB
    toggle_loading('start');
    var docRef = db.collection('sessions').doc(current_session).collection('players').doc(current_player),
        index = get_player_index(current_player),
        currentsRef = countries[index].currents,
        data = { // Create data
            budget: currentsRef.budget,
            healthy: currentsRef.healthy,
            infected: currentsRef.infected,
            dead: currentsRef.dead,
            coop: currentsRef.coop.toFixed(2),
            masks: currentsRef.masks.toFixed(2),
            infection_rate: currentsRef.infection_rate.toFixed(2),
            research_speed: currentsRef.research_speed.toFixed(2),
        };
    docRef.update(data).then(function () { // Push data to DB
        var docRef = db.collection('sessions').doc(current_session).collection('global_stats').doc('cure_progress'),
            unique_ID = db.collection('sessions').doc().id,
            data = { // Create data
                cure_progress: global_cure,
                update_sync: unique_ID,
            };
        docRef.update(data).then(function () { // Push data to DB
            ui_update_stats(current_player);
            ui_update_global_cure();
            toggle_loading('stop');
        }).catch(function (error) {
            console.error(error);
        });
    }).catch(function (error) {
        console.error(error);
    });
}

// =========================
// EVENTS & CHALLENGES
// =========================

var current_event;

function present_challenge() { // Displays card
    const e_index = random_int(events.length - 1); // Random event
    event_card.style.backgroundImage = `url('graphics/event_${e_index}.png')`;
    event_card.innerText = '';

    // Make quickRef variables
    const index = get_player_index(current_player),
        defaultsRef = countries[index].defaults, // Defaults object
        currentsRef = countries[index].currents; // Currents object

    // Make BEGIN function string
    current_event = events[e_index];
    const fn_string = 'event_begin_' + (current_event.replace(/ /g, "_")),
        fn_params = [defaultsRef, currentsRef];
    console.log(fn_string);
    // Find it
    fn = window[fn_string];
    // Validate & run it
    if (typeof fn === "function") fn.apply(null, fn_params);

    setTimeout(function () {
        // I am delayed
        push_current_stats();
    }, 500);
}

const events = [ // Array of objects
    // 'Origin',
    'Unemployment',
    'Strikes',
    'Low on Law Enforcers',
    'Head Hunter',
    'Viral Video',
    'Mutation',
];

// Immediate Event Impacts

// function event_begin_Origin() {

// }
function event_begin_Unemployment(defaultsRef, currentsRef) {
    currentsRef.coop -= currentsRef.coop * 0.05; // Co-op drops by 5%
}
function event_begin_Strikes(defaultsRef, currentsRef) {
    currentsRef.research_speed -= currentsRef.research_speed * random_min_max(0.1, 0.2); // Research slows by 10-20%
    currentsRef.infected += currentsRef.infected * 0.02; // Infection amount increases 2%
}
function event_begin_Low_on_Law_Enforcers(defaultsRef, currentsRef) {
    currentsRef.research_speed -= currentsRef.research_speed * 0.1; // Research slows by 10%
    currentsRef.coop -= currentsRef.coop * 0.1; // Co-op drops by 10%.
}
function event_begin_Head_Hunter(defaultsRef, currentsRef) {
    // Nothing.
}
function event_begin_Viral_Video(defaultsRef, currentsRef) {
    currentsRef.coop -= currentsRef.coop * random_min_max(0.15, 0.2); // Co-op drop up to 15-20%
}
function event_begin_Mutation(defaultsRef, currentsRef) {
    global_cure -= global_cure * random_min_max(0.15, 0.2); // Global Cure Progress loss 15-20%
}

// === Decision Based Event Impacts ===

// Init vars
var percent_spent;
var calc_coop;
var calc_research_speed;

// function event_end_Origin() {

// }
function event_end_Unemployment(defaultsRef, currentsRef) {
    // funding problem: Co-op increased up to 20%
    // Ignores: Co-op decrease up to 30%

    percent_spent = (r_budget / currentsRef.budget) + 0.5;

    // console.log(percent_spent + 'p spent'); // [?????????????????????????????????????????????????????????????]
    calc_coop = (percent_spent * 1.2);
    currentsRef.coop *= calc_coop;
    if (currentsRef.coop > 100) { currentsRef.coop = 100 };
    console.log('Unemployment.......... coop            = ' + currentsRef.coop.toFixed(2));
}
function event_end_Strikes(defaultsRef, currentsRef) {
    // funding problem: Co-op improves up to 15-20%, immediate research drop negation
    // Ignores: Co-op decreased 5-10%  

    percent_spent = (r_budget / currentsRef.budget);

    if ((((r_budget / currentsRef.budget) * 100).toFixed(2)) > 50) { // Funded
        calc_coop = currentsRef.coop * (percent_spent * Math.random(0.15, 0.2));
        currentsRef.coop += calc_coop;
        if (currentsRef.coop > 100) { currentsRef.coop = 100 };
        console.log('Strikes funded........ coop            = ' + currentsRef.coop.toFixed(2));
    } else { // Ignored
        calc_coop = currentsRef.coop * (percent_spent * Math.random(0.05, 0.1));
        currentsRef.coop -= calc_coop;
        if (currentsRef.coop > 100) { currentsRef.coop = 100 };
        console.log('Strikes ignored....... coop            = ' + currentsRef.coop.toFixed(2));
    }
}
function event_end_Low_on_Law_Enforcers(defaultsRef, currentsRef) {
    // funding problem: Research can boost 10-15%.
    // Ignores: No change to research or Co-op.

    percent_spent = (r_budget / currentsRef.budget);

    calc_research_speed = currentsRef.research_speed * (percent_spent * Math.random(0.10, 0.15));
    currentsRef.research_speed += calc_research_speed;
    if (currentsRef.research_speed > 100) { currentsRef.research_speed = 100 };
    console.log('More Enforcement...... research_speed  = ' + currentsRef.research_speed.toFixed(2));
}
function event_end_Head_Hunter(defaultsRef, currentsRef) { // AKA 'IMMIGRATION'
    // funding prob: Increase research var up to 10%, Infection amount increases by 1%
    // Ignores: Co-op drops 3-5%

    percent_spent = (r_budget / currentsRef.budget);

    if ((((r_budget / currentsRef.budget) * 100).toFixed(2)) > 50) { // Funded
        calc_research_speed = currentsRef.research_speed * (percent_spent * 0.1);
        currentsRef.research_speed += calc_research_speed;
        if (currentsRef.research_speed > 100) { currentsRef.research_speed = 100 };
        console.log('Immigration funded.... research_speed  = ' + currentsRef.research_speed.toFixed(2));
    } else { // Ignored
        calc_coop = currentsRef.coop * (percent_spent * 0.04);
        currentsRef.coop -= calc_coop;
        if (currentsRef.coop > 100) { currentsRef.coop = 100 };
        console.log('Immigration ignored... coop            = ' + currentsRef.coop.toFixed(2));
    }
}
function event_end_Viral_Video(defaultsRef, currentsRef) {
    // Nothing.
}
function event_end_Mutation(defaultsRef, currentsRef) {
    // Nothing.
}

// =========================
// SCOREBOARD
// =========================

const scoreboard = docQ('#scoreboard');

function build_scoreboard() {
    const scoreboard_insert = docQ('#scoreboard_insert');
    scoreboard_insert.innerHTML = ''; // Reset
    countries.forEach(country => {
        if (country.name == current_player) {
            // [Need to figure out proper negation logic]
        } else {
            scoreboard_insert.innerHTML += `
            <div class="row">
                <p class="country_name">${country.name}</p>
                <div class="row">
                    <div class="score_wrap">
                        <div class="bar_wrap">
                            <div class="bar bar_healthy" id="score_healthy_${country.name}"></div>
                            <div class="bar bar_infected" id="score_infected_${country.name}"></div>
                            <div class="bar bar_dead" id="score_dead_${country.name}"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }
    });
}

function end_the_game(condition) { // 1 param 'condition', is a string of 'win' or 'loss'
    end_game_block = true;
    // Display the correct modal
    if (condition === 'loss') {
        console.log('The world has lost to the pandemic!');
        toggle_modal('modal_loss');
    } else {
        console.log('The pandemic is over!');
        toggle_modal('modal_win');
    }
}

// =========================
// SOUNDS & MUSIC
// =========================

var bgm_playing = false;
function play_tone(target) { // Call sounds with their file name Ex. play_tone('bgm');
    const audio = new Audio(`sounds/${target}.mp3`);
    if (target === 'bgm' && !bgm_playing) { // If it's the background music play it on loop
        bgm_playing = true;
        audio.loop = true;
        audio.play();
    } else {
        audio.play();
    }
}

// =========================
// PLANES
// =========================

const map_paths = docQA('svg path');
var first_plane1 = false;
var first_plane2 = false;

function fly_plane(plane_num) {
    const airplane_wrap = docQ(`#airplane_wrap${plane_num}`),
        airplane = docQ(`#airplane${plane_num}`);

    if (first_plane1) {
        // Start Country Coords
        const start = map_paths[random_int(map_paths.length)],
            coords_start = start.getBoundingClientRect(),
            start_centerX = coords_start.left + coords_start.width / 2 + 'px',
            start_centerY = coords_start.top + coords_start.height / 2 + 'px';

        set_start(start_centerX, start_centerY); // Set Starting Point
        function set_start(x, y) {
            first_plane1 = false;
            airplane_wrap.style.left = x;
            airplane_wrap.style.top = y;
        }
    }
    if (first_plane2) {
        // Start Country Coords
        const start = map_paths[random_int(map_paths.length)],
            coords_start = start.getBoundingClientRect(),
            start_centerX = coords_start.left + coords_start.width / 2 + 'px',
            start_centerY = coords_start.top + coords_start.height / 2 + 'px';

        set_start(start_centerX, start_centerY); // Set Starting Point
        function set_start(x, y) {
            first_plane2 = false;
            airplane_wrap.style.left = x;
            airplane_wrap.style.top = y;
        }
    }

    // End Country Coords
    const end = map_paths[random_int(map_paths.length)];
    const coords_end = end.getBoundingClientRect(),
        end_centerX = coords_end.left + coords_end.width / 2 + 'px',
        end_centerY = coords_end.top + coords_end.height / 2 + 'px';

    setTimeout(function () {
        // I am delayed
        // Set Airplane Coords
        const coords_airplane = airplane.getBoundingClientRect();
        move(end_centerX, end_centerY);
        set_angle(coords_airplane.left, coords_airplane.top, coords_end.left, coords_end.top); // Move the Plane
    }, 500);

    // FUNCTIONS

    function move(x, y) {
        airplane_wrap.style.left = x;
        airplane_wrap.style.top = y;
    }

    function set_angle(p1_x, p1_y, p2_x, p2_y) {
        const p1 = {
            x: Math.round(p1_x),
            y: Math.round(p1_y)
        };

        const p2 = {
            x: Math.round(p2_x),
            y: Math.round(p2_y)
        };

        // Angle in degrees
        const angle = Math.round(Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI);
        airplane.style.transform = `rotate(${angle}deg)`;
    }
}

setInterval(function () { // Fly a plane every 30s
    fly_plane(1);
}, 30000);

setInterval(function () { // Fly a plane every 30s
    fly_plane(2);
}, 20000);

// =========================
// INITS
// =========================

// Tasks that need to run before anything else, such as default values

toggle_modal('modal_intro');
var current_turn = 0;
turn_stat.innerText = `Turn #${current_turn}`;
var end_game_block = false;
var global_cure = 0;

// =========================
// DEV INITS / FUNCTIONS
// =========================

fly_plane(1);
fly_plane(2);

function dev_login(player, role, session) {
    setTimeout(function () { // Auto-login
        // I am delayed
        intro_close_button.click();
        setTimeout(function () {
            session_input.value = session;
            role_input.value = role;
            player_input.value = player;
            setTimeout(function () {
                // I am delayed
                login_button.click();
                if (role === 'host') {
                    setTimeout(function () {
                        // I am delayed
                        begin_button.click();
                    }, 1500);
                }
            }, 50);
        }, 100);
    }, 100);
}

// Put functions you want to run each refresh here to skip basic setup things like logging in

function dev_next_player(target) { // Signals the next turn
    toggle_loading('start');
    const docRef = db.collection('sessions').doc(current_session).collection('global_stats').doc('next_player'),
        unique_ID = db.collection('sessions').doc().id,
        data = { // Create data
            next_player: target,
            update_sync: unique_ID,
        };
    docRef.set(data).then(function () { // Push data to DB
        toggle_loading('stop');
    }).catch(function (error) {
        console.error(error);
    });
}

function dev_add_dead(player, num) { // Signals the next turn
    const index = get_player_index(player),
        currentsRef = countries[index].currents,

        healthy = currentsRef.healthy - num,
        dead = currentsRef.dead + num,

        docRef = db.collection('sessions').doc(current_session).collection('players').doc(player),
        data = { // Create data
            healthy: healthy,
            dead: dead,
        };
    docRef.update(data).then(function () { // Push data to DB
        console.log('Done');
    }).catch(function (error) {
        console.error(error);
    });
}

// toggle_modal('close');
// hud.classList.add('hud_open');

// =========================
// DEV NOTES
// =========================

// === Process to update all client stats ===

// Local client = the current player taking a turn
// End user = all players except local client

// 1. Local client finishes their turn
// 2. Action causes the stat 'change' variables to update
// 3. Local client updates the client end obj stat w/ changes
// 4. Local client updates their UI stats
// 5. Local client pushes the obj stat to Firebase
// 6. All end-users hear change and pull the new stats (use a special field with AutoID to signal it)
// 7. All end-users update the changed country's local array country.currents obj w the new stats
// 8. All end-users update their UI stats

// === Process to update turns ===
// 1. All users have a play order, for now do USA -> China -> Germany -> Angola
//      Randomize? Idea: host end decides order, posts order to Firebase, end users pick up the order and set their next_player values
// 2. When a local client finishes their turn, push the next players country name to current_turn field
// 3. All clients hear the change, and respond locally
//      Handler: next_player === current player ? begin-turn() : show-current-player(next_player);
