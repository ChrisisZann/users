import Sequelize from "sequelize";
import jsyaml from 'js-yaml';
import fs from 'fs-extra';
import util from 'util';
import DBG from 'debug';
import e from "express";
const log = DBG('users:model-users');
const error = DBG('users:error');

var SQUser;
var sequlz;
async function connectDB() {
    if (SQUser) return SQUser.sync();
    const yamltext = await fs.readFile(process.env.SEQUELIZE_CONNECT, 'utf-8');
    const params = await jsyaml.safeLoad(yamltext, 'utf-8');
    if (!sequlz) {
        sequlz = new Sequelize(
            params.dbname,
            params.username,
            params.password,
            params.params);
    }
    if (!SQUser) {
        SQUser = sequlz.define('User', {
            username: { type: Sequelize.STRING, unique: true },
            password: Sequelize.STRING,
            provider: Sequelize.STRING,
            familyName: Sequelize.STRING,
            givenName: Sequelize.STRING,
            middleName: Sequelize.STRING,
            emails: Sequelize.STRING(2048),
            photos: Sequelize.STRING(2048)
        });
    }
    return SQUser.sync();
}

export async function create(username, password, provider, familyName, givenName, middleName, emails, photos) {
    const SQUser = await connectDB();
    return SQUser.create({
        username,
        password,
        provider,
        familyName,
        givenName,
        middleName,
        emails: JSON.stringify(emails),
        photos: JSON.stringify(photos)
    })
}

export async function update(username, password, provider, familyName, givenName, middleName, emails, photos) {
    const user = await find(username);
    return user ? updateAttributes({
        password,
        provider,
        familyName,
        givenName,
        middleName,
        emails: JSON.stringify(emails),
        photos: JSON.stringify(photos)
    }) : undefined;
}

export async function find(username) {
    const SQUser = await connectDB();
    const user = await SQUser.find({
        where: { username: username }
    });
    const ret = user ? sanitizedUser(user) : undefined;
    return ret;
}

export async function destroy(username) {
    const SQUser = await connectDB();
    const user = await SQUser.find({
        where: { username: username }
    });
    if (!user) throw new Error('Did not find requested ' + username + ' to delete');
    user.destroy();
}

export async function userPasswordCheck(username, password) {
    const SQUser = await connectDB();
    const user = await SQUser.find({
        where: { username: username }
    });
    if (!user) {
        return {
            check: false,
            username: username,
            message: "Could not find user"
        };
    } else if (user.username == username && user.password == password) {
        return {
            check: true,
            username: username
        }
    } else {
        return {
            check: false,
            username: username,
            message: "Incorrect password"
        };
    }
}

export async function listUsers() {
    const SQUser = await connectDB();
    const userlist = await SQUser.findAll({});
    return userlist.map(user => sanitizedUser(user));
}
export function sanitizedUser(user) {
    var ret = {
        id: user.username,
        username: user.username,
        provider: user.provider,
        familyName: user.familyName,
        givenName: user.givenName,
        middleName: user.middleName,
        emails: JSON.stringify(user.emails),
        photos: JSON.stringify(user.photos)
    }
    try {
        ret.emails = JSON.parse(user.emails);
    } catch (e) {
        ret.emails = [];
    }
    try {
        ret.photos = JSON.parse(user.photos);
    } catch (e) {
        ret.photos = [];
    }
}