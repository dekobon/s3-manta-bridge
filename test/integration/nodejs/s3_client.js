'use strict';

let assert = require('assert-plus');
let AWS = require('aws-sdk');
let proxy = require('proxy-agent');
let bunyan = require('bunyan');
let mod_lo = require('lodash');

let config;

let log = bunyan.createLogger({
    level: (process.env.LOG_LEVEL || 'debug'),
    name: 's3-client',
    stream: process.stdout
});

function client() {
    let httpOptions = {};

    if (process.env.http_proxy) {
        log.debug('Using proxy with S3 client: %s', process.env.http_proxy);
        httpOptions.agent = proxy(process.env.http_proxy);
    } else if (process.env.https_proxy) {
        log.debug('Using proxy with S3 client: %s', process.env.https_proxy);
        httpOptions.agent = proxy(process.env.https_proxy);
    }

    if (mod_lo.isEmpty(config.baseHostname)) {
        throw new Error('Base hostname is not configured. See configuration file.');
    }

    if (!mod_lo.isNumber(config.serverPort)) {
        throw new Error('Server port is not configured. See configuration file.');
    }

    let client = new AWS.S3({
        apiVersion: '2006-03-01',
        params: {},
        httpOptions: httpOptions,
        endpoint: `http://${config.baseHostname}:${config.serverPort}`,
        sslEnabled: false,
        logger: process.stderr,
        signatureVersion: 'v4',
        credentials: new AWS.Credentials(config.accessKey, config.secretKey)
    });

    assert.ok(client);
    return client;
}

module.exports = function (_config) {
    config = _config;

    return {
        client: client
    };
};
