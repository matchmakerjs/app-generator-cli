module.exports = {
    "roots": [
        "src",
        "test"
    ],
    "testMatch": [
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    "coveragePathIgnorePatterns": [
        "node_modules",
        "test",
    ],
}