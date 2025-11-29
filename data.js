// Data Loader - Loads game data from static JSON files

class DataLoader {
    constructor() {
        this.TILE_SIZE = 32;
        this.loaded = false;
        this.data = {
            characters: null,
            jobs: null,
            creatures: null,
            npcs: null,
            shop: null
        };
    }

    async loadAll() {
        try {
            const [characters, jobs, creatures, npcs, shop] = await Promise.all([
                fetch('static/characters.json').then(r => r.json()),
                fetch('static/jobs.json').then(r => r.json()),
                fetch('static/creatures.json').then(r => r.json()),
                fetch('static/npcs.json').then(r => r.json()),
                fetch('static/shop.json').then(r => r.json())
            ]);

            this.data.characters = characters.characters;
            this.data.jobs = jobs.jobTemplates;
            this.data.creatures = creatures.creatures;
            this.data.npcs = npcs.npcs;
            this.data.shop = shop.items;

            this.loaded = true;
            return true;
        } catch (error) {
            console.error('Failed to load game data:', error);
            return false;
        }
    }

    getTiles() {
        return {
            grass: { color: '#2d5016', walkable: true },
            path: { color: '#8b7355', walkable: true },
            water: { color: '#1e4d8b', walkable: false },
            sand: { color: '#e0d0a0', walkable: true },
            building: { color: '#6b5b3e', walkable: false },
            door: { color: '#4a3520', walkable: true, isInteraction: true },
            tallGrass: { color: '#3d6b21', walkable: true, encounter: true },
            lighthouse: { color: '#c0c0c0', walkable: false },
            tree: { color: '#1a3d0f', walkable: false },
            shop: { color: '#8b4513', walkable: false },
            counter: { color: '#654321', walkable: false }
        };
    }

    getMap() {
        return {
            main: {
                width: 20,
                height: 15,
                tiles: [
                    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                    [2,3,3,3,3,3,3,8,0,0,0,0,0,8,3,3,3,3,3,2],
                    [2,3,7,7,7,3,3,0,0,6,6,6,0,0,3,4,4,4,3,2],
                    [2,3,7,7,7,3,1,1,1,6,6,6,1,1,1,4,5,4,3,2],
                    [2,3,3,5,3,3,1,0,0,6,6,6,0,0,1,4,4,4,3,2],
                    [2,3,3,3,3,3,1,0,0,0,0,0,0,0,1,3,3,3,3,2],
                    [2,8,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,8,2],
                    [2,0,0,0,0,0,1,1,1,1,5,1,1,1,1,0,0,0,0,2],
                    [2,0,0,0,8,0,0,0,0,4,4,4,0,0,0,0,8,0,0,2],
                    [2,0,0,0,0,0,0,0,0,4,9,4,0,0,0,0,0,0,0,2],
                    [2,0,8,0,0,0,0,0,0,4,4,4,0,0,0,0,0,8,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,0,0,8,0,0,0,0,0,0,0,8,0,0,0,0,2],
                    [2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2],
                    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
                ],
                tileKey: ['grass', 'path', 'water', 'sand', 'building', 'door', 'tallGrass', 'lighthouse', 'tree', 'shop', 'counter']
            }
        };
    }

    getEncounterZones() {
        return [
            { x: 9, y: 2, width: 3, height: 3, creature: 'seasprite', chance: 0.3 }
        ];
    }

    getPlayerStart() {
        return { x: 3, y: 5 };
    }

    getInitialState() {
        return {
            coins: 0,
            inventory: [],
            creatures: [
                {
                    name: "Shellback",
                    stats: {
                        heart: 30,
                        maxHeart: 30,
                        power: 6,
                        guard: 6,
                        speed: 8
                    }
                }
            ],
            completedJobs: [],
            activeJobs: [],
            defeatedEncounters: [],
            character: null
        };
    }
}

// Global data loader instance
const gameDataLoader = new DataLoader();
