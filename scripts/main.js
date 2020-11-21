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
    if (new_modal == 'close') {
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
        update_current_player_stat(player_input.value);
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
const current_player_stat = docQ('#current_player_stat');
function update_current_player_stat(value) {
    current_player = value;
    current_player_stat.innerText = value;
    update_ui_stats();
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

function update_ui_stats() { // Only updates the UI with the current stat info from the array
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

// Put functions you want to run here to skip basic setup things
// For example, I don't wanna login EVERY time im editing something so toggle modals closed
// toggle_modal('close'); // For dev purposes