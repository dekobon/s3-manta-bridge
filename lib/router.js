/**
 * S3 subdomain routing operations.
 *
 * @module buckets
 */

"use strict";

var mod_lo = require('lodash');

///--- Globals

var mod_restify_errors = require('restify-errors');

var errors = require('./errors');
var utils = require('./utils');
var buckets;
var objects;
var options;

///--- API

function findBucketName(req) {
    var bucket;
    var host = utils.parseDomainFromHostWithPort(req.headers.host);

    // typically a bucket is identified by the subdomain
    var subdomain = utils.parseSubdomain(host);

    /* It is possible to use a S3 bucket outside of a subdomain. For example,
     * s3cmd supports adding buckets directly to the base subdomain. Thus, we
     * detect if the subdomain is valid and if it isn't, we fall back to
     * behavior that depends on the value of the first parsed parameter from
     * the routes. */
    var subdomainIsBucket =
        subdomain !== null &&
        subdomain.length > 1 &&
        subdomain !== options.baseSubdomain;

    if (!subdomainIsBucket) {
        if (req.params.length < 1) {
            bucket = null;
        } else {
            var firstDir = utils.splitFirstDirectory(req.path()).first;
            // Strip slashes because a bucket will never have slashes
            bucket = mod_lo.trim(firstDir, '/');
        }
    } else {
        bucket = subdomain;
    }

    return bucket;
}

function head(isBaseEndpoint, bucket, req, res, next) {
    // If we are at the service base, then just reply that we are healthy
    if (isBaseEndpoint) {
        res.send(200);
        return next();
    }

    if (bucket === null) {
        return next(new errors.InvalidBucketNameError(bucket));
    }
    return buckets.bucketExists(bucket, req, res, next);
}

function get(isBaseEndpoint, bucket, req, res, next) {
    if (isBaseEndpoint) {
        return buckets.listBuckets(req, res, next);
    }

    // TODO: List objects
    res.send(501);
    return next();
}

function put(isBaseEndpoint, bucket, req, res, next) {
    if (bucket === null) {
        return next(new errors.InvalidBucketNameError(bucket));
    }

    var paths = utils.splitFirstDirectory(req.path());

    if (isBaseEndpoint || (paths.first === '/' && paths.remaining.length < 1)) {
        return buckets.addBucket(bucket, req, res, next);
    }

    // TODO: Add object
    res.send(501);
    return next();
}

function post(isBaseEndpoint, bucket, req, res, next) {
    res.send(501);
    return next();
}

function del(isBaseEndpoint, bucket, req, res, next) {
    if (bucket === null) {
        return next(new errors.InvalidBucketNameError());
    }

    var paths = utils.splitFirstDirectory(req.path());

    if (isBaseEndpoint || (paths.first === '/' && paths.remaining.length < 1)) {
        return buckets.removeBucket(bucket, req, res, next);
    }

    // TODO: Delete object
    res.send(501);
    return next();
}

function Route(req, res, next) {
    var log = req.log;
    var method = req.method;
    var host = utils.parseDomainFromHostWithPort(req.headers.host);

    // typically a bucket is identified by the subdomain
    var subdomain = utils.parseSubdomain(host);
    var bucket = findBucketName(req);

    var isBaseEndpoint = subdomain === null || subdomain === options.baseSubdomain;

    log.debug('%s %s [%s]', method, req.path(), bucket);

    switch (method) {
        case 'HEAD':
            return head(isBaseEndpoint, bucket, req, res, next);
        case 'GET':
            return get(isBaseEndpoint, bucket, req, res, next);
        case 'PUT':
            return put(isBaseEndpoint, bucket, req, res, next);
        case 'POST':
            return post(isBaseEndpoint, bucket, req, res, next);
        case 'DELETE':
            return del(isBaseEndpoint, bucket, req, res, next);
        default:
            return next(new mod_restify_errors.MethodNotAllowedError('[%s] is not allowed', method));
    }
}

module.exports = function (_options) {
    options = _options;
    buckets = require('./buckets')(options);
    objects = require('./objects')(options);

    return {
        route: Route
    };
};