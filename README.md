# Setup

Clone project and open terminal in project root to execute the following scripts

## Export github user token
`export GITHUB_USER_TOKEN=YOUR_USER_TOKEN_HERE`

## Install Dependencies
`npm i`

## Compile soure code
`npm run tsc`

## Export app-setup cli
`chmod +x dist/cli.js && npm link -f`


# Example Application

## Setup App Directory

Create app directory and optionally initialize it with `npm init`.

Create `.npmrc` file in the app directory and update its content as follows

```
@matchmakerjs:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${GITHUB_USER_TOKEN}
```

## App Setup
Open terminal at the app root and execute the following scripts

### Export github user token
`export GITHUB_USER_TOKEN=YOUR_USER_TOKEN_HERE`

### Generate App
`app-setup add ts ts-lint ts-jest matchmaker`

## Run App

### Execute tests
Update package.json to match the following if you used `npm init`.

```
{
...
"scripts": {
    "test": "jest",
    ...
 },
...
}
```

Run `npm test`

### Run dev server
Run `npm start` and visit `http://127.0.0.1:5000` in your browser
