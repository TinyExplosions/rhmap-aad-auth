var $fh = require("fh-mbaas-api");
var Logger = require('fh-logger-helper');

if (!process.env.SERVICE_ID) {
    Logger.error("process.env.SERVICE_ID not set");
}

exports = module.exports = function(opts) {
    opts = opts || {};
    var redirect = opts.redirect;
    var roles = opts.roles || [];
    roles = roles instanceof Array ? roles : [roles];
    var scope = opts.scope

    return function protect(req, res, next) {
        if (!process.env.SERVICE_ID) {
            Logger.error("Service ID not set");
            return res.status(412).send("process.env.SERVICE_ID not set");
        }

        // check either cookie or header for UserID, header takes precedence
        var header = req.headers && req.headers['x-fh-session'] ? req.headers['x-fh-session'] : null;
        var cookie = req.cookies && req.cookies['X-FH-Session'] ? req.cookies['X-FH-Session'] : null;
        var userID = header || cookie;

        if (!userID) {
            Logger.error("no userid");
            if (!redirect) {
                Logger.info("No Header or Cookie Set, not authorised")
                return res.status(401).send("unauthorised");
            } else {
                res.AuthError = "No Header or Cookie Set, not authorised";
                return res.redirect(redirect);
            }
        }

        $fh.service({
            "guid": process.env.SERVICE_ID,
            "path": "/verify",
            "method": "POST",
            "params": {
                sessionID: userID,
                roles: roles,
                scope: scope
            }
        }, function(err, body, service_res) {
            if (err) {
                Logger.error("svc error");
                if (!redirect) {
                    // An error occurred
                    Logger.error('Service call failed: ', err, service_res);
                    return res.status(502).send("Server Error");
                } else {
                    res.AuthError = "Service call failed";
                    return res.redirect(redirect);
                }
            } else {
                if (service_res.statusCode == 200) {
                    req.UserJWT = userID;
                    req.User = body;
                    return next();
                } else {
                    Logger.error("not 200");
                    if (!redirect) {
                        return response.status(service_res.statusCode).send(body);
                    } else {
                        res.AuthError = service_res.statusCode + " from the verify service";
                        return res.redirect(redirect);
                    }
                }
            }
        });
    }
};
