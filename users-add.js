'use strict';

import util from 'util';
import restify from 'restify-clients';


var client = restify.createJSONClient({
    url: 'http://localhost:3333',
    version: '*'
});

client.basicAuth(
    'them',
    'D4ED43C0-8BD6-4FE2-BBBB-7C0E230D11EF'
);

client.post(
    '/create-user', {
        username: "me",
        password: "w0rD",
        provider: "local",
        familyName: "Zann",
        givenName: "Chris",
        middleName: "none",
        emails: [],
        photos: []
    },
    (err, req, res, obj) => {
        if (err) console.log(err.stack);
        else console.log("Created" + util.inspect(obj))
    }
);