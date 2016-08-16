var config = require("../lib/config.js");
var engine = require("../lib/engine.js");

function hasconfig(env, ctx, next) {
    var target = this[0];
    var _default = undefined;
    if (!target) {
        target = env["subconfig"];
    }
    if (typeof target == "object") {
        //get stuff from env
        target = env[target["var"]];
        _default = env[target["default"]];
    }
    var n = config.get(target) || (_default ? config.get(_default) : undefined);
    return next(n ? NEXT : REJECT);
}

function subconfig(env, ctx, next) {
    var target = this[0];
    var _default = undefined;
    if (!target) {
        target = env["subconfig"];
    }
    if (typeof target == "object") {
        //get stuff from env
        target = env[target["var"]] || target["src"];
        _default = env[target["default"]];
    }
    var n = config.get(target) || (_default ? config.get(_default) : undefined);
    if (!n) {
        throw new Error("sub config not found:", target);
        // return next(REJECT); //not found
    }
    engine.run(ctx, n, next);
}

VERB("default", "subconfig", subconfig);
VERB("default", "hasconfig", hasconfig);
VERB("default", "sub", subconfig);
