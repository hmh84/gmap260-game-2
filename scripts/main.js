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
const slider = docQ('#slider');
slider.addEventListener('change', update_slider_val);
function update_slider_val() {
    console.log(slider.value);
}