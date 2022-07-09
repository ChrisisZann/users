import restify from 'restify';
import util from 'util';
import DBG from 'debug';
const log = DBG('users:model-users');
const error = DBG('users:error');

import * as usersModel from './users-sequalize.mjs';
import { checkPrime } from 'crypto';
import e from 'express';

var server = restify.createServer({
    name: "User-Auth-Service",
    version: "0.0.1"
});

server.use(restify.plugins.authorizationParser());
server.use(check);
server.use(restify.plugins.queryParser);
// Because of the mapParams flag on the bodyParams handler, 
// the arguments passed in the HTTP body are added to req.params.
server.use(restify.plugins.bodyParser({
    mapParams: true
}));

//Create a user record
// As a POST request, the parameters arrive 
// in the body of the request rather than as URL parameters.
server.post('/create-user', async(req, res, next) => {
    try {
        var result = await usersModel.create(
            req.params.username,
            req.params.password,
            req.params.provider,
            req.params.familyName,
            req.params.givenName,
            req.params.middleName,
            req.params.emails,
            req.params.photos
        );
        res.send(result);
        next(false);
    } catch (err) {
        res.send(500, err);
        next(false);
    }
});

// we have put the username parameter on the URL. Like Express, 
// Restify lets you put named parameters in the URL like as follows. 
server.post('/update-user/:username', async(req, res, next) => {
    try {
        var result = await usersModel.update(
            req.params.username,
            req.params.password,
            req.params.provider,
            req.params.familyName,
            req.params.givenName,
            req.params.middleName,
            req.params.emails,
            req.params.photos
        );
        res.send(usersModel.sanitizedUser(result));
        next(false);
    } catch (err) {
        res.send(500, err);
        next(false);
    }
});

server.post('/find-or-create-user', async(req, res, next) => {
    log('find-or-create ' + util.inspect(req.params));
    try {
        var result = await usersModel.findOrCreate({
            id: req.params.username,
            username: req.params.username,
            password: req.params.password,
            provider: req.params.provider,
            familyName: req.params.familyName,
            givenName: req.params.givenName,
            middleName: req.params.middleName,
            emails: req.params.emails,
            photos: req.params.photos
        });
        res.send(result);
        next(false);
    } catch (err) {
        res.send(500, err);
        next(false);
    }
});

server.get('/find:username', async(req, res, next) => {
    log('find-or-create ' + util.inspect(req.params));
    try {
        var user = await usersModel.find(req.params.username);
        if (!user) {
            res.send(
                400,
                new Error("Did not find user " + req.params.username));
        } else {
            res.send(user);
        }
        next(false);
    } catch (err) {
        res.send(500, err);
        next(false);
    }
});

server.del('/destroy:username', async(req, res, next) => {
    log('find-or-create ' + util.inspect(req.params));
    try {
        await usersModel.destroy(req.params.username);
        res.send({});
        next(false);
    } catch (err) {
        res.send(500, err);
        next(false);
    }
});

server.post('/passwordCheck', async(req, res, next) => {
    try {
        var userlist = await usersModel.userPasswordCheck(req.params.usernamereq.params.password);
        if (!userlist) { userlist = []; }
        res.send(userlist);
        next(false);
    } catch (err) {
        res.send(500, err);
        next(false);
    }
});

server.get('/list', async(req, res, next) => {
    try {
        var userlist = await usersModel.listUsers();
        if (!userlist) { userlist = []; }
        res.send(userlist);
        next(false);
    } catch (err) {
        res.send(500, err);
        next(false);
    }
});

server.get('/test', async(req, res, next) => {
    res.send("This server is running");
});

// server.listen(process.env.PORT, function() {
//     log(server.name + 'listening at ' + server.url);
// });
server.listen(process.env.PORT, "localhost", function() {
    log(server.name + 'listening at ' + server.url);
});

//Mimic API Key authentication
var apiKeys = [{
    user: 'them',
    key: 'D4ED43C0-8BD6-4FE2-BBBB-7C0E230D11EF'
}];

// The authorizationParser handler looks for this and 
// gives it to us on the req.authorization.basic object. 
// The check function simply verifies that the named user and 
// password combination exists in the local array.
//
// Because we added check with the initial set of server.use handlers, 
// it is called on every request. Therefore, every request to this server 
// must provide the HTTP basic auth credentials required by this check.
//
function check(req, res, next) {
    if (req.authorization) {
        var found = false;
        for (let auth of apiKeys) {
            if (auth.key === req.authorization.basic.password &&
                auth.user === req.authorization.basic.username) {
                found = true;
                break;
            }
        }
        if (found) next();
        else {
            res.send(401, new Error("Not authenticated"));
            next(false);
        }
    } else {
        res.send(500, new Error("No Authorization Key"));
        next(false);
    }
}