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
            button.disabled = true;
        });
    } else { // When finished
        loading.style.display = 'none';
        // Enable all buttons
        all_buttons.forEach(button => {
            button.disabled = false;
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
    add_stat_subscriptions();
    add_sync_subscription();
    countries.forEach(country => { // Updates UI for ALL countries
        ui_update_stats(country.name);
    });
    play_tone('bgm');
}

function unlock_game() {
    // This is really where the game begins for all players
    // From here we can allow interactions to take place
    // This gets called when the host begins the game
    toggle_modal('close');
    console.log('Game is starting');
    hud.classList.add('hud_open');
}

// =========================
// HOST ROLE SETUP
// =========================

const begin_button = docQ('#begin_button');
begin_button.addEventListener('click', start_game);

function init_host() { // Functions specific to host role
    toggle_modal('modal_host_controls');
    reset_game();
}

function reset_game() { // Default all values in Firebase
    toggle_loading('start');
    countries.forEach(country => {
        const docRef = db.collection('sessions').doc(current_session).collection('stats').doc(country.name),
            countryRef = country.defaults,
            popRef = countryRef.population,

            data = { // Create data
                budget: countryRef.budget,
                cure_progress: countryRef.cure_progress,
                coop: popRef.coop,
                healthy: popRef.healthy,
                infected: popRef.infected,
                dead: popRef.dead,
                masks: popRef.masks,
            };

        docRef.set(data).then(function () { // Push data to DB
            console.log('Reset country stat');
            toggle_loading('stop');
        }).catch(function (error) {
            console.error(error);
        });
    });
}

function start_game() { // Starts the game for all players
    toggle_loading('start');
    init_common();
    docRef = db.collection('sessions').doc(current_session);

    const unique_ID = db.collection('sessions').doc().id,
        data = { // Create data
            ready_sync: unique_ID,
            next_player: next_player,
        };

    setTimeout(function () {
        // I am delayed
        docRef.update(data).then(function () { // Push data to DB
            console.log('Syncing Game');
            toggle_loading('stop');
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
}

// =========================
// FIREBASE SUBSCRIPTIONS
// =========================

let subscriptions = [];

// Game Start/Reset
function add_sync_subscription() {
    var snap_count = 0;
    const docRef = db.collection('sessions').doc(current_session),
        sub = docRef.onSnapshot(function (doc) { // When an update occurs...
            snap_count++;
            if (snap_count > 1) { // After the default snapshot...
                docRef.get().then(function (doc) {
                    // Make quickRef variables
                    const result = doc.data();

                    // Unlock the game for all players
                    unlock_game();
                    result.next_player === current_player ? begin_turn() : end_turn(next_player);
                }).catch(function (error) {
                    console.log('Error getting document:', error);
                });
            }
        });
    subscriptions.push(sub); // Add subscription to subscriptions array
}

// Stat Updates
function add_stat_subscriptions() { // Adds Firebase snapshot listeners for country stat updates
    countries.forEach(country => {
        var snap_count = 0;
        if (country.name == current_player) { // Add sub to everyone except yourself
            // [Need to figure out proper negation logic]
        } else {
            const docRef = db.collection('sessions').doc(current_session).collection('stats').doc(country.name),
                sub = docRef.onSnapshot(function (doc) { // When an update occurs...
                    snap_count++;
                    if (snap_count > 1) { // After the default snapshot...
                        docRef.get().then(function (doc) {
                            // Make quickRef variables
                            const result = doc.data(),
                                index = get_player_index(country.name),
                                countryRef = countries[index].current,
                                popRef = countryRef.population;

                            // Update the 'current' part of the array obj
                            countryRef.budget = result.budget;
                            countryRef.cure_progress = result.cure_progress;
                            popRef.coop = result.coop;
                            popRef.healthy = result.healthy;
                            popRef.infected = result.infected;
                            popRef.dead = result.dead;
                            popRef.masks = result.masks;

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

// Unsubscribe function
function unsub_all() { // Unsubscribes all Firebase snapshot listeners
    subscriptions.forEach(sub => {
        // Calling the sub itself as a function will unsubscribe it per Firebase syntax
        sub();
    });
}

// =========================
// COUNTRIES & STATS
// =========================

var countries = [ // Array of objects
    {
        name: 'USA',
        defaults: {
            budget: 1200000000000,
            cure_progress: 0, // %
            population: {
                coop: 60, // %
                healthy: 314617600,
                infected: 13120000,
                dead: 262400,
                masks: 0,
            },
        },
        current: {
            budget: 1200000000000,
            cure_progress: 0,
            population: {
                coop: 60,
                healthy: 314617600,
                infected: 13120000,
                dead: 262400,
                masks: 0,
            },
        },
    },
    {
        name: 'China',
        defaults: {
            budget: 4600000000000,
            cure_progress: 0,
            population: {
                coop: 90,
                healthy: 1336165600,
                infected: 55720000,
                dead: 1114400,
                masks: 0,
            },
        },
        current: {
            budget: 4600000000000,
            cure_progress: 0,
            population: {
                coop: 90,
                healthy: 1336165600,
                infected: 55720000,
                dead: 1114400,
                masks: 0,
            },
        },
    },
    {
        name: 'Germany',
        defaults: {
            budget: 462000000000,
            cure_progress: 0,
            population: {
                coop: 70,
                healthy: 79613600,
                infected: 3320000,
                dead: 66400,
                masks: 0,
            },
        },
        current: {
            budget: 462000000000,
            cure_progress: 0,
            population: {
                coop: 70,
                healthy: 79680000,
                infected: 3320000,
                dead: 66400,
                masks: 0,
            },
        },
    },
    {
        name: 'Angola',
        defaults: {
            budget: 1870000000,
            cure_progress: 0,
            population: {
                coop: 40,
                healthy: 28776000,
                infected: 1200000,
                dead: 24000,
                masks: 0,
            },
        },
        current: {
            budget: 1870000000,
            cure_progress: 0,
            population: {
                coop: 40,
                healthy: 28776000,
                infected: 1200000,
                dead: 24000,
                masks: 0,
            },
        },
    },
];

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

function update_slider_val() {
    const index = get_player_index(current_player),
        countryCurRef = countries[index].current; // Current object

    slider.max = countryCurRef.budget; // Set's max budget for the slider

    slider_val_left.innerText = 'Problem: $' + num_format(slider.max - slider.value);
    slider_val_right.innerText = 'Cure: $' + num_format(slider.value);
}

slider.addEventListener('input', update_slider_val);

// UI Stats
const healthy_stat = docQ('#healthy_stat'),
    infected_stat = docQ('#infected_stat'),
    dead_stat = docQ('#dead_stat'),
    masks_stat = docQ('#masks_stat'),
    coop_stat = docQ('#coop_stat'),
    budget_stat = docQ('#budget_stat'),
    cure_progress_stat = docQ('#cure_progress_stat');

function ui_update_stats(target) { // Updates UI and checks for win/loss
    // Param 'Target' is a string of the country name

    // Get your country
    const country = get_player_obj(target),
        // Get the array stats (as integers)
        healthy = country.current.population.healthy,
        infected = country.current.population.infected,
        dead = country.current.population.dead,
        ttl_population = healthy + infected + dead,
        masks = country.current.population.masks,
        coop = country.current.population.coop,
        budget = num_format(country.current.budget),
        cure_progress = country.current.cure_progress,

        // As percentages (these are just strings, do not calculate with them)
        p_dead = ((dead / ttl_population) * 100).toFixed(2) + '%',
        p_infected = ((infected / ttl_population) * 100).toFixed(2) + '%',
        p_masks = ((masks / ttl_population) * 100).toFixed(2) + '%',
        p_healthy = (((ttl_population - infected - dead) / ttl_population) * 100).toFixed(2) + '%';

    if (country.name == current_player) { // Your user
        // Display array stats
        healthy_stat.innerText = healthy;
        infected_stat.innerText = infected;
        dead_stat.innerText = dead;
        masks_stat.innerText = p_masks;
        coop_stat.innerText = coop;
        budget_stat.innerText = `$${budget}`;

        // Cure progress stat
        cure_progress_stat.style.width = `${cure_progress}%`;
        cure_progress_stat.innerText = `${cure_progress}%`;
    } else {  // Only applies to end users
        docQ(`#score_healthy_${country.name}`).style.height = p_healthy;
        docQ(`#score_infected_${country.name}`).style.height = p_infected;
        docQ(`#score_dead_${country.name}`).style.height = p_dead;
    }

    // Color the country on the map with infection rate
    docQ(`[data-country="${country.name}"]`).style.opacity = .5 + (infected / 100);

    infected >= ttl_population / 2 && end_the_game('loss'); // Check if 50% infected
}

// =========================
// TURNS
// =========================

function begin_turn() {
    console.log('It is my turn');
    update_turn_stat();
    add_turn_budget();
    present_challenge();
}

function end_turn(next_player) {
    console.log(`It's ${next_player}'s turn now`);
    // Display who's taking their turn
    // Display what challenge they are facing??
    // Pushes the new player to the db
}

const turn_stat = docQ('#turn_stat');
function update_turn_stat() {
    current_turn++; // Increase current_turn by one
    turn_stat.innerText = `Turn #${current_turn}`; // Display it
}

function add_turn_budget() { // Update the current budget with (default budget / 5)
    const index = get_player_index(current_player),
        countryDefRef = countries[index].defaults, // Defaults object
        countryCurRef = countries[index].current; // Current object

    countryCurRef.budget = countryCurRef.budget + (countryDefRef.budget / 5);
    update_slider_val();
}

function update_cure_progress() {
    const progress_budget = slider.value; //How much money the player spent on funding research
    const development_chance = 6;
    const budget_multiplier = 4000000000; //How much money equates to '1' point of development

    const progress = (progress_budget / budget_multiplier) * (Math.random(4, development_chance) / 10);
    console.log(progress.toFixed(2)); // Some outputs given: 7.9, 5.4, 2.69, 7.42, 9.94, 3.51
}

// =========================
// EVENTS & CHALLENGES
// =========================

function present_challenge() {
    const index = random_int(3); // Random event
    event_card.style.backgroundImage = `url('graphics/event_${index}.png')`;
    console.log(events[index].name);
}

var events = [ // Array of objects
    {
        name: 'Unemployment',
    },
    {
        name: 'Strikes',
    },
    {
        name: 'Low on Law Enforcers',
    },
];

// =========================
// SCOREBOARD
// =========================

const scoreboard = docQ('#scoreboard');

function build_scoreboard() {
    const scoreboard_insert = docQ('#scoreboard .row');
    countries.forEach(country => {
        if (country.name == current_player) {
            // [Need to figure out proper negation logic]
        } else {
            scoreboard_insert.innerHTML += `
            <div class="column">
                <p class="country_name">${country.name}</p>
                <div class="column">
                    <div class="score_wrap">
                        <div class="bar_wrap">
                            <div class="bar bar_infected" id="score_infected_${country.name}"></div>
                            <div class="bar bar_dead" id="score_dead_${country.name}"></div>
                            <div class="bar bar_healthy" id="score_healthy_${country.name}"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }
    });
}

function end_the_game(condition) { // 1 param 'condition', is a string of 'win' or 'loss'
    if (condition === 'loss') {
        console.log('The world has lost to the pandemic!');
    } else {
        console.log('The pandemic is over!');
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
// INITS
// =========================

// Tasks that need to run before anything else, such as default values

toggle_modal('modal_login');
var current_turn = 0;
update_turn_stat();

// =========================
// DEV INITS
// =========================

// Put functions you want to run each refresh here to skip basic setup things like logging in

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
// 7. All end-users update the changed country's local array country.current obj w the new stats
// 8. All end-users update their UI stats

// === Process to update turns ===
// 1. All users have a play order, for now do USA -> China -> Germany -> Angola
//      Randomize? Idea: host end decides order, posts order to Firebase, end users pick up the order and set their next_player values
// 2. When a local client finishes their turn, push the next players country name to current_turn field
// 3. All clients hear the change, and respond locally
//      Handler: next_player === current player ? begin_turn() : show_current_player(next_player);