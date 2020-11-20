// =========================
// HELPER FUNCTIONS/STUFF
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

// Slider
const slider = docQ('#slider'),
    slider_val = docQ('#slider_val');

slider_val.innerText = 'Slider Value = ' + slider.value; // Init

slider.addEventListener('change', update_slider_val);
function update_slider_val() {
    slider_val.innerText = 'Slider Value = ' + slider.value;
}

// Map

map_paths = docQA('#Layer_1 path');

map_paths.forEach(path => {
    path.addEventListener('click', (e) => {
        e.target.style.fill = '#ffffff';
        console.log(path);
    })
});

// Progress Bar

const cure_progress_bar = docQ('#cure_progress_bar')

function update_cure_progress_bar(value) {
    // Used to update UI element of the cure progress
    // Param 'value' should be an integer of 0-100
    // update_cure_progress_bar
    cure_progress_bar.style.width = `${value}%`;
}

update_cure_progress_bar('50'); // 50%