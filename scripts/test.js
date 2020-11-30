// // Format

// function num_format(num) {
//     if (num >= 1000000000000) {
//         return (num / 1000000000000).toFixed(2).replace(/\.0$/, '') + ' Trillion';
//     }
//     if (num >= 1000000000) {
//         return (num / 1000000000).toFixed(2).replace(/\.0$/, '') + ' Billion';
//     }
//     if (num >= 1000000) {
//         return (num / 1000000).toFixed(2).replace(/\.0$/, '') + ' Million';
//     }
//     if (num >= 1000) {
//         return (num / 1000).toFixed(2).replace(/\.0$/, '') + ' Thousand';
//     }
//     return num;
// }

// // USA Defaults

// var budget = 1200000000000 / 5; // Per Turn is $240 B
// var research_speed = 5;
// var coop = 60;
// var infection_rate = .05;
// var masks = 60;
// var healthy = 314617600;
// var infected = 13120000;
// var dead = 262400;
// var origin = false;

// var percent_spent;
// var calc_coop;
// var calc_research_speed;

// // --------------------------------------------------------
// console.log('');
// console.log('+=+=+ START +=+=+');

// function test_funding(funding) {
//     console.log('');
//     console.log('=== Funding to Events: ' + ((funding / budget) * 100).toFixed(2) + '% OR $' + num_format(funding));
//     console.log('');
//     // --------------------------------------------------------
//     // ========= Unemployment =========

//     percent_spent = (funding / budget) + 0.5;
//     // console.log(percent_spent + 'p spent');
//     calc_coop = (percent_spent * 1.2);
//     coop *= calc_coop;
//     if (coop > 100) { coop = 100 };
//     console.log('Unemployment.......... coop            = ' + coop.toFixed(2));

//     // ========= More Enforcement =========

//     percent_spent = (funding / budget);
//     calc_research_speed = research_speed * (percent_spent * Math.random(0.10, 0.15));
//     research_speed += calc_research_speed;
//     if (research_speed > 100) { research_speed = 100 };
//     console.log('More Enforcement...... research_speed  = ' + research_speed.toFixed(2));

//     // ========= Strikes =========
//     percent_spent = (funding / budget);

//     if (((funding / budget) * 100).toFixed(2) > 50) { // Funded
//         calc_coop = coop * (percent_spent * Math.random(0.15, 0.2));
//         coop += calc_coop;
//         if (coop > 100) { coop = 100 };
//         console.log('Strikes funded........ coop            = ' + coop.toFixed(2));
//     } else { // Ignored
//         calc_coop = coop * (percent_spent * Math.random(0.05, 0.1));
//         coop -= calc_coop;
//         if (coop > 100) { coop = 100 };
//         console.log('Strikes ignored....... coop            = ' + coop.toFixed(2));
//     }

//     // ========= Immigration =========
//     percent_spent = (funding / budget);

//     if (((funding / budget) * 100).toFixed(2) > 50) { // Funded
//         calc_research_speed = research_speed * (percent_spent * 0.1);
//         research_speed += calc_research_speed;
//         if (research_speed > 100) { research_speed = 100 };
//         console.log('Immigration funded.... research_speed  = ' + research_speed.toFixed(2));
//     } else { // Ignored
//         calc_coop = coop * (percent_spent * 0.04);
//         coop -= calc_coop;
//         if (coop > 100) { coop = 100 };
//         console.log('Immigration ignored... coop            = ' + coop.toFixed(2));
//     }
// }

// const amounts = [
//     0, // 0%
//     budget / 3, // 33%
//     ((budget / 3) * 2), // 66%
//     budget, // 100%
// ]

// amounts.forEach(funding => {
//     test_funding(funding);
// });

// console.log('');
// console.log('+=+=+ END +=+=+');
// console.log('');












// SOMETHING ELSE
const funding = 240000000000 // usa budget
const global_cure = 0;
const research_speed = 1; // max of .3
// 1 over research speed * 
const development_chance = 5.5,
    budget_multiplier = 7000000000, //How much money equates to '1' point of development
    progress = ((funding / budget_multiplier) * (Math.random(4.5, development_chance) / 10).toFixed(2) * research_speed);

if (progress > 6) {
    progress = 6;
}

console.log((global_cure + progress).toFixed(2));