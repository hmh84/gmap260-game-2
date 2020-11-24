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
    add_stat_subscriptions();
    add_sync_subscription();
    countries.forEach(country => { // Updates UI for ALL countries
        ui_update_stats(country.name);
    });
}

function unlock_game() {
    // This is really where the game begins for all players
    // From here we can allow interactions to take place
    // This gets called when the host begins the game
    if (current_turn < 1) { // Only beginning of the game
        toggle_modal('close');
        console.log('Game is starting');
        hud.classList.add('hud_open');
        toggle_loading('stop');
    }
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
        const docRef = db.collection('sessions').doc(current_session).collection('stats').doc(country.name),
            defaultsRef = country.defaults,
            popRef = defaultsRef.population,

            data = { // Create data
                budget: defaultsRef.budget / 5,
                cure_progress: defaultsRef.cure_progress,
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
function add_sync_subscription() {
    var snap_count = 0;
    const docRef = db.collection('sessions').doc(current_session),
        sub = docRef.onSnapshot(function (doc) { // When an update occurs...
            snap_count++;
            if (snap_count > 1) { // After the default snapshot...
                setTimeout(function () {
                    // I am delayed
                    docRef.get().then(function (doc) {
                        // Make quickRef variables
                        const result = doc.data();

                        // Unlock the game for all players

                        unlock_game();
                        if (result.next_player === current_player) {
                            begin_turn();
                        } else {
                            turn_stat.innerText = `${result.next_player} is taking their turn...`;
                            event_card.style.backgroundImage = '';
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
                                currentRef = countries[index].current,
                                popRef = currentRef.population;

                            // Update the 'current' part of the array obj
                            currentRef.budget = result.budget;
                            currentRef.cure_progress = result.cure_progress;
                            popRef.coop = result.coop;
                            popRef.healthy = result.healthy;
                            popRef.infected = result.infected;
                            popRef.dead = result.dead;
                            popRef.masks = result.masks;

                            (country.name);

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
                infection_rate: .05,
                healthy: 314617600,
                infected: 13120000,
                dead: 262400,
                masks: 0,
            },
        },
        current: {
            budget: 240000000000,
            cure_progress: 0,
            population: {
                coop: 60,
                infection_rate: .05,
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
                infection_rate: .05,
                healthy: 1336165600,
                infected: 55720000,
                dead: 1114400,
                masks: 0,
            },
        },
        current: {
            budget: 920000000000,
            cure_progress: 0,
            population: {
                coop: 90,
                infection_rate: .05,
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
                infection_rate: .04,
                healthy: 79613600,
                infected: 3320000,
                dead: 66400,
                masks: 0,
            },
        },
        current: {
            budget: 92400000000,
            cure_progress: 0,
            population: {
                coop: 70,
                infection_rate: .04,
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
                infection_rate: .02,
                healthy: 28776000,
                infected: 1200000,
                dead: 24000,
                masks: 0,
            },
        },
        current: {
            budget: 374000000,
            cure_progress: 0,
            population: {
                coop: 40,
                infection_rate: .02,
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
var c_budget, r_budget;

function update_slider_val() {
    const index = get_player_index(current_player),
        currentRef = countries[index].current; // Current object

    slider.max = currentRef.budget; // Set's max budget for the slider

    r_budget = slider.max - slider.value;
    c_budget = slider.value;

    slider_val_left.innerText = 'Problem: $' + num_format(r_budget);
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
        p_healthy = (((ttl_population - infected - dead) / ttl_population) * 100).toFixed(2) + '%',
        p_masks = ((masks / ttl_population) * 100).toFixed(2) + '%',
        p_coop = ((coop / ttl_population) * 100).toFixed(2) + '%';

    if (country.name == current_player) { // Your user
        // Display array stats
        healthy_stat.style.width = p_healthy;
        infected_stat.style.width = p_infected;
        dead_stat.style.width = p_dead;
        masks_stat.innerText = p_masks;
        coop_stat.innerText = p_coop;
        budget_stat.innerText = `$${budget}`;

        // Cure progress stat
        cure_progress_stat.style.width = `${cure_progress.toFixed(2)}%`;
        cure_progress_stat.innerText = `${cure_progress.toFixed(2)}%`;
    } else {  // Only applies to end users
        docQ(`#score_healthy_${country.name}`).style.width = p_healthy;
        docQ(`#score_infected_${country.name}`).style.width = p_infected;
        docQ(`#score_dead_${country.name}`).style.width = p_dead;
    }

    // Color the country on the map with infection rate
    docQ(`[data-country="${country.name}"]`).style.opacity = .3 + (parseFloat(p_infected) / 100.0);

    check_for_win_or_loss(ttl_population, cure_progress, infected, dead);
}

function check_for_win_or_loss(ttl_population, cure_progress, infected, dead) { // Win & Loss Conditions
    // Win Conditions
    if (cure_progress >= 100) {
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
            currentRef = countries[index].current; // Current object

        currentRef.budget = currentRef.budget + (defaultsRef.budget / 5);
    }
    update_slider_val();
}

function update_player_stats() { // This is where ALL player stats will get updated and pushed to the DB
    // Make quickRef variables
    const index = get_player_index(current_player),
        defaultsRef = countries[index].defaults, // Defaults object
        currentRef = countries[index].current, // Current object
        popRef = currentRef.population; // Current Ref Population object

    // ===== Update Cure Progress ===== //

    if (slider.value > currentRef.budget) { // Limit spending
        update_cure_progress(currentRef.budget);
        currentRef.budget = 0;
    } else { // Spend full amount
        currentRef.budget = currentRef.budget - c_budget; // Spend budget
        update_cure_progress(c_budget);
    }

    function update_cure_progress(funds) {
        const development_chance = 6,
            budget_multiplier = 5000000000, //How much money equates to '1' point of development
            progress = (funds / budget_multiplier) * (Math.random(4, development_chance) / 10).toFixed(2);

        currentRef.cure_progress = currentRef.cure_progress + progress;
    }

    // ===== Update Infection Rate ===== //

    const new_cases = Math.round((popRef.healthy * popRef.infection_rate));
    // portion = .02;
    // + Math.random(-(popRef.healthy * portion), (popRef.healthy * portion)).toFixed(0);

    popRef.infected += new_cases;
    popRef.healthy -= new_cases;

    // ===== Push Changes to the DB ===== //

    push_current_stats();
}

const spend_resource_button = docQ('#spend_resource_button');
spend_resource_button.addEventListener('click', () => {
    end_turn();
})

function end_turn() {
    update_player_stats();
    push_next_player();
    clearInterval(turn_int);
    time_stat.innerText = '';
    event_card.style.backgroundImage = '';
    turn_stat.innerText = `${next_player} is taking their turn...`;
    spend_resource_button.disabled = true;
    // Idea: Display what challenge they are facing??
}

function push_next_player() { // Signals the next turn
    toggle_loading('start');
    const docRef = db.collection('sessions').doc(current_session),
        data = { // Create data
            next_player: next_player,
        };
    docRef.update(data).then(function () { // Push data to DB
        toggle_loading('stop');
    }).catch(function (error) {
        console.error(error);
    });
}

function push_current_stats() { // Pushes all current local client stats to DB
    toggle_loading('start');
    const docRef = db.collection('sessions').doc(current_session).collection('stats').doc(current_player),
        index = get_player_index(current_player),
        currentRef = countries[index].current,
        popRef = currentRef.population,
        data = { // Create data
            budget: currentRef.budget,
            cure_progress: currentRef.cure_progress.toFixed(2),
            coop: popRef.coop,
            healthy: popRef.healthy,
            infected: popRef.infected,
            dead: popRef.dead,
            masks: popRef.masks,
        };
    docRef.update(data).then(function () { // Push data to DB
        ui_update_stats(current_player);
        toggle_loading('stop');
    }).catch(function (error) {
        console.error(error);
    });
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
// INITS
// =========================

// Tasks that need to run before anything else, such as default values

toggle_modal('modal_intro');
var current_turn = 0;
turn_stat.innerText = `Turn #${current_turn}`;
var end_game_block = false;

// =========================
// DEV INITS / FUNCTIONS
// =========================

// Put functions you want to run each refresh here to skip basic setup things like logging in

function dev_next_player(target) { // Signals the next turn
    toggle_loading('start');
    const docRef = db.collection('sessions').doc(current_session),
        data = { // Create data
            next_player: target,
        };
    docRef.update(data).then(function () { // Push data to DB
        toggle_loading('stop');
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
// 7. All end-users update the changed country's local array country.current obj w the new stats
// 8. All end-users update their UI stats

// === Process to update turns ===
// 1. All users have a play order, for now do USA -> China -> Germany -> Angola
//      Randomize? Idea: host end decides order, posts order to Firebase, end users pick up the order and set their next_player values
// 2. When a local client finishes their turn, push the next players country name to current_turn field
// 3. All clients hear the change, and respond locally
//      Handler: next_player === current player ? begin-turn() : show-current-player(next_player);
