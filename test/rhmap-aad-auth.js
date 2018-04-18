
var assert = require('assert');
var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var request = require('supertest');
var validate = require('../');
var util = require('util');

describe('validate()', function() {
    it('should export constructors', function() {
        assert.equal(typeof validate, 'function')
    })

});
