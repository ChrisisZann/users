import { ifError } from 'assert';
import { createJsonClient } from 'restify-clients';

var client = createJsonClient({
    url: 'http://localhost:3366',
    version: '*'
});

client.basicAuth(
    'them',
    'D4ED43C0-8BD6-4FE2-BBBB-7C0E230D11EF'
);

client.get('/echo/HelloW', function(err, req, res, obj) {
    console.log('i am going to try atleast');
    if (err) console.log(err.stack);
    else
        console.log('Server returned: %j', obj);
});