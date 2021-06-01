const fs = require('fs');
const path = require('path');

const express = require('express');

const app = express();
const port = 3000;


app.get('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');

    const searchString = req.query.searchString;

    const response = [
        {
            title: `${searchString} first search item`,
            link: `https://codex.so/` + `${searchString} first search item`.replace(/([^a-zA-Z0-9])/g, '-')
        },
        {
            title: `${searchString} another one search item`,
            link: `https://codex.so/` + `${searchString} another one search item`.replace(/([^a-zA-Z0-9])/g, '-')
        },
        {
            title: `${searchString} third item`,
            link: `https://codex.so/` + `${searchString} third item`.replace(/([^a-zA-Z0-9])/g, '-')
        }
    ];

    res.setHeader('Content-Type', 'application/json');
    res.send(response);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
