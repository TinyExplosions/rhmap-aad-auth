# rhmap-aad-auth

An NPM module providing an express.js middleware function that can check Azure AD authentication.

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install https://github.com/TinyExplosions/rhmap-aad-auth
```

You also need to ensure that the environment variable `process.env.SERVICE_ID` is correctly set to
the Service ID of the RHMAP Azure AD Service.

## API

```js
var validate = require('rhmap-aad-auth')
```

### validate(groups, redirect)

Create a validate middleware with the given options.


#### Options

`rhmap-aad-auth` accepts these properties in the options object.

##### groups

Specifies either a `string` or an `array` of AD Groups to check as part of the Authorisation step.

```js
var app = express()
app.use(validate('app-superUser'))
```

Ensures that the request is from a user that is a member of the `app-superUser` group.


```js
var app = express()
app.use(validate(['app-read','app-write']))
```

Ensures that the request is from a user that is a member of either, or both the `app-superUser` group and
the `app-write` group.


##### redirect

Specifies a `string` that will be used as a redirect url if authorisation fails for any reason.

**Note** this can be a relative url `"/"`, or a FQDN `"https://foo.bar/login"` -the middleware will call a
`res.redirect(redirect)` in the event of a failure to authorise.

```js
var app = express()
app.use(validate(null, '/login'))
```

This will redirect any failed authorisation attempts to the `/login` route of your app.

If a `redirect` value is not set, this middleware will return http status codes as follows

`412 Precondition Failed` if `process.env.SERVICE_ID` is not set
`401 Unauthorized` if the request to be checked doesn't contain a `x-fh-session` cookie or header
`502 Bad Gateway` if the call to the Auth service fails in an unexpected manner
For all other non `200 OK` responses from the Auth service, this status will be piped to the response


## Return Value

If a user is succesfully validated, an object, `req.User` is created and can be used if required. This object
is in the following format.

##### req.User

```js
{
    "token_type": "Bearer",
    "expires_in": "3600",
    "ext_expires_in": "0",
    "expires_on": "1521815866",
    "access_token": "<AAD Access Token, can be used as a bearer token in subsequent requests>",
    "refresh_token": "<AAD Refresh Token>",
    "id_token": "<JWT containing user details>"
}
```

##### req.User.id_token

```js
{
  "aud": "a6c492a7-0011-1234-1a2b-f1a610c037bc",
  "iss": "https://sts.windows.net/ea93752e-a476-42d4-aaf4-7286352b0f7e/",
  "iat": 1521801653,
  "nbf": 1521801653,
  "exp": 1521805553,
  "aio": "ATQAy/8GAAAAImVpshaPmmjWzx6mhXP716IUWGqX0i/sLDastt73a4xR6214HKi2Trr9MYk+GN2a",
  "amr": [
    "pwd",
    "mfa"
  ],
  "family_name": "Bloggs",
  "given_name": "Joe",
  "ipaddr": "218.101.10.34",
  "name": "Blogs, Joe (SOME COMPANY)",
  "nonce": "5a86a15d-41dd-49c0-86b1-904c2e731969",
  "oid": "246d7b59-1926-4f0d-a19d-240ef40f64df",
  "onprem_sid": "S-2-7-12-1801839531-515954399-839122115-17448786",
  "sub": "TWwwphw489EGZK9aB_Y9fA2_-5jQyIVNsmYpIse_DE",
  "tid": "ea80322e-a476-89d4-aaf5-5457801b0f7e",
  "unique_name": "Joe.Bloggs@email.com",
  "upn": "Joe.Bloggs@email.com",
  "uti": "_FQTP3y07UKjs7zXO7sEEP",
  "ver": "1.0"
}
```

## Example

A simple example using `rhmap-aad-auth` to protect endpoints.

```js
var express = require('express')
var validate = require('rhmap-aad-auth')
process.env.SERVICE_ID = "<serviceid>"

var app = express()

app.get('/login', function (req, res, next) {
  res.send('you need to login to access the protected endpoints')
})

app.get('/open', function (req, res, next) {
  res.send('This page is availabe to the public')
})

app.get('/foo', validate('admin'), function (req, res, next) {
  res.send('You are in the admin group, and can view this page')
})

// If a user isn't authenticated, you will be redirected to the login page for any
routes below here.
app.use(validate('user', '/login'))

app.get('/bar', function (req, res, next) {
  res.send('You are in the user group, so can access this page')
})

app.get('/bat', function (req, res, next) {
  res.send('You are in the user group, so can access this page')
})
```

## License

[GPL-3.0](LICENSE)