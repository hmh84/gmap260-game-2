// =========================
// GENERAL FUNCTIONS
// =========================

const docQ = document.querySelector.bind(document),
    docQA = document.querySelectorAll.bind(document);

const all_buttons = docQA('button');
// all_buttons.forEach(button => {
//     button.addEventListener('click', (e) => {
//         e.preventDefault();
//     })
// });

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

function num_with_commas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
        document.body.classList.remove('noscroll');
    } else {
        document.querySelector(`#${new_modal}`).style.display = 'flex';
    }
}

function toggle_loading(state) { // Show or Hide the loading animation
    // Param 'state' must either be 'start' or 'stop'
    const loading = docQ('#loading');

    if (state === 'start') {
        loading.style.display = 'flex';
        all_buttons.forEach(button => {
            button.disabled = true;
        });
    } else {
        loading.style.display = 'none';
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
// COMMON SETUP
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
    toggle_modal('close');
    console.log('Game is starting');
    hud.classList.add('hud_open');
}

// =========================
// HOST SETUP
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
        docRef = db.collection('sessions').doc(current_session).collection('stats').doc(country.name);

        const data = { // Create data
            budget: country.defaults.budget,
            cure_progress: country.defaults.cure_progress,
            coop: country.defaults.population.coop,
            healthy: country.defaults.population.healthy,
            infected: country.defaults.population.infected,
            dead: country.defaults.population.dead,
            masks: country.defaults.population.masks,
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

    const uniqueID = db.collection('sessions').doc().id,
        data = { // Create data
            ready_sync: uniqueID,
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
// PLAYER SETUP
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
                    // Turn the data into a quick variable
                    const result = doc.data();
                    // Unlock game
                    unlock_game();
                    if (result.next_player === current_player) {
                        // Take first turn
                        console.log('Yes');
                    }
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
        } else {
            const docRef = db.collection('sessions').doc(current_session).collection('stats').doc(country.name),
                sub = docRef.onSnapshot(function (doc) { // When an update occurs...
                    snap_count++;
                    if (snap_count > 1) { // After the default snapshot...
                        docRef.get().then(function (doc) {
                            // Turn the data into a quick variable
                            const result = doc.data();

                            // Update the 'current' part of the array obj
                            const index = get_player_index(country.name);

                            countries[index].current.budget = result.budget;
                            countries[index].current.cure_progress = result.cure_progress;
                            countries[index].current.population.coop = result.coop;
                            countries[index].current.population.healthy = result.healthy;
                            countries[index].current.population.infected = result.infected;
                            countries[index].current.population.dead = result.dead;
                            countries[index].current.population.masks = result.masks;

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
        sub(); // Calling the sub itself as a function will unsubscribe it
    });
}

// =========================
// COUNTRIES & STATS
// =========================

var countries = [ // Array of objects
    {
        name: 'USA',
        defaults: {
            budget: 1027000000000,
            cure_progress: 0, // %
            population: {
                coop: 60, // %
                healthy: 328200000,
                infected: 0,
                dead: 0,
                masks: 0, // %
            },
        },
        current: {
            budget: 1027000000000,
            cure_progress: 0,
            population: {
                coop: 60,
                healthy: 328200000,
                infected: 0,
                dead: 0,
                masks: 0,
            },
        },
    },
    {
        name: 'China',
        defaults: {
            budget: 680500000000,
            cure_progress: 0,
            population: {
                coop: 90,
                healthy: 1393000000,
                infected: 0,
                dead: 0,
                masks: 0,
            },
        },
        current: {
            budget: 680500000000,
            cure_progress: 0,
            population: {
                coop: 90,
                healthy: 1393000000,
                infected: 0,
                dead: 0,
                masks: 0,
            },
        },
    },
    {
        name: 'Germany',
        defaults: {
            budget: 154740000000,
            cure_progress: 0,
            population: {
                coop: 70,
                healthy: 82000000,
                infected: 0,
                dead: 0,
                masks: 0,
            },
        },
        current: {
            budget: 154740000000,
            cure_progress: 0,
            population: {
                coop: 70,
                healthy: 82000000,
                infected: 0,
                dead: 0,
                masks: 0,
            },
        },
    },
    {
        name: 'Angola',
        defaults: {
            budget: 5290000000,
            cure_progress: 0,
            population: {
                coop: 40,
                healthy: 30000000,
                infected: 0,
                dead: 0,
                masks: 0,
            },
        },
        current: {
            budget: 5290000000,
            cure_progress: 0,
            population: {
                coop: 40,
                healthy: 30000000,
                infected: 0,
                dead: 0,
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
    login_status = docQ('#login_status'),
    hud = docQ('#hud');
function update_login_stats(value) { // Updates the UI to reflect your chosen player
    current_player = value;
    current_session = session_input.value;
    document_title.innerText = `Pandemic Simulator - Room #${current_session}`;
    login_status.innerText = `Playing as ${current_player} in Room #${current_session}`
    current_player_stat.innerText = value;
}

// Turns
const turn_stat = docQ('#turn_stat');
function update_turn_stat() {
    current_turn++; // Increase current_turn by one
    turn_stat.innerText = `Turn #${current_turn}`;
}

// Slider
const slider = docQ('#slider'),
    slider_val = docQ('#slider_val');

function update_slider_val() {
    slider_val.innerText = 'Slider Value = ' + slider.value;
}
slider.addEventListener('change', update_slider_val);

// UI Stats
const healthy_stat = docQ('#healthy_stat'),
    infected_stat = docQ('#infected_stat'),
    dead_stat = docQ('#dead_stat'),
    masks_stat = docQ('#masks_stat'),
    coop_stat = docQ('#coop_stat'),
    budget_stat = docQ('#budget_stat'),
    cure_progress_stat = docQ('#cure_progress_stat');

function ui_update_stats(target) { // Only updates the UI with the current stat info from the array
    // Get your country
    const country = get_player_obj(target),
        // Get the array stats
        healthy = num_with_commas(country.current.population.healthy),
        infected = num_with_commas(country.current.population.infected),
        dead = num_with_commas(country.current.population.dead),
        masks = country.current.population.masks,
        coop = country.current.population.coop,
        budget = num_with_commas(country.current.budget),
        cure_progress = num_with_commas(country.current.cure_progress);

    if (country.name == current_player) { // Your user
        // Display array stats
        healthy_stat.innerText = healthy;
        infected_stat.innerText = infected;
        dead_stat.innerText = dead;
        masks_stat.innerText = `${masks}%`;
        coop_stat.innerText = `${coop}%`;
        budget_stat.innerText = `${budget}`;

        // Cure progress stat
        cure_progress_stat.style.width = `${cure_progress}%`;
        cure_progress_stat.innerText = `${cure_progress}%`;
    } else {  // Only applies to end users
        // Nums
        // docQ(`#score_infected_${country.name}`).innerText = `${infected}%`;
        // docQ(`#score_dead_${country.name}`).innerText = `${dead}%`;
        // docQ(`#score_cure_progress_${target}`).innerText = `${cure_progress}%`;
        // Bars
        docQ(`#score_infected_${country.name}`).style.height = `${infected}%`;
        docQ(`#score_dead_${country.name}`).style.height = `${dead}%`;
        docQ(`#score_cure_progress_${target}`).style.height = `${cure_progress}%`;
    }
}

// =========================
// SCOREBOARD
// =========================
const scoreboard = docQ('#scoreboard');

function build_scoreboard() {
    const scoreboard_insert = docQ('#scoreboard .row');
    countries.forEach(country => {
        if (country.name == current_player) {
        } else {
            scoreboard_insert.innerHTML += `
            <div class="column">
                <p class="country_name">${country.name}</p>
                <div class="row">
                    <div class="score_wrap">
                        <div class="bar_wrap">
                            <div class="bar" id="score_infected_${country.name}"></div>
                        </div>
                        <label for=".bar" class="score_label">Infected</label>
                    </div>
                    <div class="score_wrap">
                        <div class="bar_wrap">
                            <div class="bar" id="score_dead_${country.name}"></div>
                        </div>
                        <label for=".bar" class="score_label">Dead</label>
                    </div>
                    <div class="score_wrap">
                        <div class="bar_wrap">
                            <div class="bar" id="score_cure_progress_${country.name}"></div>
                        </div>
                        <label for=".bar" class="score_label">Cure</label>
                    </div>
                </div>
            </div>
        `;
        }
    });
}

// =========================
// EVENTS
// =========================

var events = [ // Array of objects
    {
        name: 'Unemployment'
    },
    {
        name: 'Need More Enforcement'
    },
    {
        name: 'Strikes'
    },
];

// =========================
// INITS
// =========================

// Tasks that need to run before anything else, such as default values

toggle_modal('modal_login');
var current_turn = 0;
update_turn_stat();
update_slider_val();

// =========================
// DEV INITS
// =========================

// Put functions you want to run each refresh here to skip basic setup things like logging in

// toggle_modal('close');
// hud.classList.add('hud_open');

// =========================
// DEV NOTES
// =========================

// === Process to setup player roles ===

// 1. Add snapshot listeners to all player stats except yourself
// 2. 

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