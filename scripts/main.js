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
    } else {
        alert('You must select all options before proceeding.');
    }
}

login_button.addEventListener('click', route_user);

// =========================
// HOST SETUP
// =========================

const begin_button = docQ('#begin_button');

function init_host() {
    toggle_modal('modal_host_controls');
    reset_game();
}

function reset_game() {
    // Default all values in Firebase
}

function begin_game() {
    // Sync game
    // Push ready status
}

begin_button.addEventListener('click', begin_game);

// =========================
// PLAYER SETUP
// =========================

function init_player() {
    toggle_modal('modal_waiting_room');
}

// =========================
// UI STATS
// =========================

// Current Player Stat (Name of your country)
const current_player_stat = docQ('#current_player_stat');
function update_current_player_stat(value) {
    turn_stat.innerText = value;
}

// Turns
const turn_stat = docQ('#turn_stat');
function update_turn_stat(value) {
    turn_stat.innerText = value;
}

// Slider
const slider = docQ('#slider'),
    slider_val = docQ('#slider_val');

function update_slider_val() {
    slider_val.innerText = 'Slider Value = ' + slider.value;
}
slider.addEventListener('change', update_slider_val);
slider_val.innerText = 'Slider Value = ' + slider.value; // Init

// Cure Progress Bar
const cure_progress_bar = docQ('#cure_progress_bar');
function update_cure_progress_bar(value) {
    // Used to update UI element of the cure progress
    // Param 'value' should be an integer of 0-100
    cure_progress_bar.style.width = `${value}%`;
    cure_progress_bar.innerText = `${value}%`;
}
update_cure_progress_bar('50'); // Init

// Population
const population_stat = docQ('#population_stat');
function update_population_stat(value) {
    population_stat.innerText = value;
}

// Masks
const masks_stat = docQ('#masks_stat');
function update_masks_stat(value) {
    masks_stat.innerText = value;
}

// =========================
// COUNTRIES
// =========================

var countries = [ // Array of objects
    {
        name: 'USA',
        defaults: {
            budget: 500000000,
            coop: 60,
            population: {
                healthy: 328200000,
                infected: 0,
                dead: 0,
            },
        },
        current: {
            budget: 500000000,
            coop: 60,
            population: {
                healthy: 328200000,
                infected: 0,
                dead: 0,
            },
        },
    },
    {
        name: 'China',
        defaults: {
            budget: 500000000,
            coop: 90,
            population: {
                healthy: 1393000000,
                infected: 0,
                dead: 0,
            },
        },
        current: {
            budget: 500000000,
            coop: 90,
            population: {
                healthy: 1393000000,
                infected: 0,
                dead: 0,
            },
        },
    },
    {
        name: 'Germany',
        defaults: {
            budget: 83000000,
            coop: 70,
            population: {
                healthy: 300000000,
                infected: 0,
                dead: 0,
            },
        },
        current: {
            budget: 83000000,
            coop: 70,
            population: {
                healthy: 300000000,
                infected: 0,
                dead: 0,
            },
        },
    },
    {
        name: 'Angola',
        defaults: {
            budget: 30000000,
            coop: 40,
            population: {
                healthy: 300000000,
                infected: 0,
                dead: 0,
            },
        },
        current: {
            budget: 30000000,
            coop: 40,
            population: {
                healthy: 300000000,
                infected: 0,
                dead: 0,
            },
        },
    },
];

var my_country = { // An Object
    name: 'USA',
    current: {
        budget: 500000000,
        coop: 60,
        population: {
            healthy: 328200000,
            infected: 0,
            dead: 0,
        },
    },
};

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