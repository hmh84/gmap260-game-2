// =========================
// COUNTRIES
// =========================

var countries = [ // Array of objects
    {
        name: 'USA',
        defaults: {
            budget: 1200000000000,
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