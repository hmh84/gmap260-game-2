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
};

toggle_modal('modal_login'); // Init

// =========================
// LOGIN & ROLES
// =========================

const login_button = docQ('#login_button'),
    session_input = docQ('#session_input'),
    role_input = docQ('#role_input'),
    player_input = docQ('#player_input');

function route_user() { // Determines user routing for host vs. players
    if (role_input.value && session_input.value && player_input.value) {
        role_input.value === 'host' ? init_host() : init_player();
        update_login_stats(player_input.value);
    } else {
        alert('You must select all options before proceeding.');
    }
}

login_button.addEventListener('click', route_user);

// =========================
// HOST SETUP
// =========================

function init_host() { // Get the host ready
    toggle_modal('modal_host_controls');
    reset_game();
}

function reset_game() { // Default all values in Firebase

}

function begin_game() { // Starts the game for all players
    // Sync game
    // Push ready status
}

const begin_button = docQ('#begin_button');
begin_button.addEventListener('click', begin_game);

// =========================
// PLAYER SETUP
// =========================

function init_player() { // Get the player ready
    toggle_modal('modal_waiting_room');
}

// =========================
// COUNTRIES
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
var current_player;
const current_player_stat = docQ('#current_player_stat'),
    document_title = docQ('title'),
    login_status = docQ('#login_status'),
    hud = docQ('#hud');
function update_login_stats(value) { // Updates the UI to reflect your chosen player
    current_player = value;
    current_player_stat.innerText = value;
    document_title.innerText = `Pandemic Simulator - Room #${session_input.value}`;
    login_status.innerText = `Playing as ${current_player} in Room #${session_input.value}`
    hud.classList.add('hud_open');
    ui_update_stats();
}

// Turns
const turn_stat = docQ('#turn_stat');
var current_turn = 0; // Init
function update_turn_stat() {
    current_turn++; // Increase current_turn by one
    turn_stat.innerText = `Turn #${current_turn}`;
}
update_turn_stat(); // Init

// Slider
const slider = docQ('#slider'),
    slider_val = docQ('#slider_val');

function update_slider_val() {
    slider_val.innerText = 'Slider Value = ' + slider.value;
}
slider.addEventListener('change', update_slider_val);
update_slider_val(); // Init

// UI Stats
const healthy_stat = docQ('#healthy_stat'),
    infected_stat = docQ('#infected_stat'),
    dead_stat = docQ('#dead_stat'),
    masks_stat = docQ('#masks_stat'),
    coop_stat = docQ('#coop_stat'),
    budget_stat = docQ('#budget_stat'),
    cure_progress_stat = docQ('#cure_progress_stat');

function ui_update_stats() { // Only updates the UI with the current stat info from the array
    // Get your country
    const country = countries.find(element => element.name === current_player),
        // Get the array stats
        healthy = num_with_commas(country.current.population.healthy),
        infected = num_with_commas(country.current.population.infected),
        dead = num_with_commas(country.current.population.dead),
        masks = country.current.population.masks,
        coop = country.current.population.coop,
        budget = num_with_commas(country.current.budget),
        cure_progress = num_with_commas(country.current.cure_progress);

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
// DEV INITS
// =========================

// Put functions you want to run each refresh here to skip basic setup things like logging in

// toggle_modal('close'); // For dev purposes

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