// =========================
// GENERAL FUNCTIONS
// =========================

const docQ = document.querySelector.bind(document),
    docQA = document.querySelectorAll.bind(document);

function random_chance(chance) { // Chance param is a decimal
    const x = Math.random().toFixed(2);
    if (x <= chance) {
        return true;
    } else {
        return false;
    }
}

// =========================
// UI STATS
// =========================

// Slider
const slider = docQ('#slider'),
    slider_val = docQ('#slider_val');

slider_val.innerText = 'Slider Value = ' + slider.value; // Init

slider.addEventListener('change', update_slider_val);
function update_slider_val() {
    slider_val.innerText = 'Slider Value = ' + slider.value;
}

// Progress Bar

const cure_progress_bar = docQ('#cure_progress_bar')

function update_cure_progress_bar(value) {
    // Used to update UI element of the cure progress
    // Param 'value' should be an integer of 0-100
    // Ex. update_cure_progress_bar('50');
    cure_progress_bar.style.width = `${value}%`;
}

// =========================
// COUNTRIES
// =========================

var countries = [
    {
        name: 'USA',
        defaults: {
            population: 328200000,
            budget: 500000000,
            coop: 60,
        }
    },
    {
        name: 'China',
        defaults: {
            population: 1393000000,
            budget: 500000000,
            coop: 90,
        }
    },
    {
        name: 'Germany',
        defaults: {
            population: 300000000,
            budget: 83000000,
            coop: 70,
        }
    },
    {
        name: 'Angola',
        defaults: {
            population: 300000000,
            budget: 30000000,
            coop: 40,
        }
    },
];

var my_country = [
    {
        name: 'USA',
        defaults: {
            population: 328200000,
            budget: 500000000,
            coop: 60,
        }
    }
]