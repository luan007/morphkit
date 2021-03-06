/** given route[][]
 *  does match / action logic (pile of)
 */

require("./utils.js");

var log4js = require('log4js');
var AsyncEventEmitter = require('async-eventemitter');
var logger = log4js.getLogger("morphkit::engine");

const QUIT = global.REJECT = global.QUIT = -1;
const COMPLETE = global.COMPLETE = 1;
const ERROR = global.ERROR = -2;
const DEFAULT = global.DEFAULT = global.NEXT = global.CONTINUE = 0;
const PASSON = global.PASSON = -5; //special / hidden property

//reserved
function _should_pass_on(env) {
    return !!env.PassOn;
}

function _step(maincb, arr, index, env, encapped_obj, result, err) {
    if (result == PASSON) {
        env._PASSON_ = true;
    }
    maincb = maincb.once();
    if (result == ERROR) {
        if (!err.shown) {
            err.shown = true;
            logger.error("Hit Error @ Step", index + 1);
            try {
                logger.error("--> Tracing Back");
                logger.error("\t" + arr[index].root + "->" + arr[index].verb);
                logger.error("\t" + arr[index].args);
            } catch (e) {

            }
            logger.error(err);
        }
        return maincb(ERROR, err);
    }
    if (result == COMPLETE) {
        //END HERE
        return maincb(COMPLETE); //eol (force)
    }
    if (result == REJECT) {
        return maincb();
    }
    if (arr.length <= index + 1) {
        if (env._PASSON_) {
            env._PASSON_ = false;
            return maincb(NEXT); //eol
        } else {
            return maincb(COMPLETE);
        }
    }
    if (!Array.isArray(arr[index + 1]) && typeof arr[index + 1] == "function") {
        process.nextTick(function () {
            try {
                arr[index + 1](
                    env,
                    encapped_obj,
                    _step.bind(null, maincb, arr, index + 1, env, encapped_obj)
                        .once()
                )
            } catch (e) {
                // return maincb(ERROR, e);
                return _step(maincb, arr, index + 1, env, encapped_obj, ERROR, e)
            }
        });
    } else if (typeof arr[index + 1] == "string") {
        process.nextTick(function () {
            return _step(maincb, arr, index + 1, env, encapped_obj, NEXT)
        });
    } else {
        process.nextTick(function () {
            try {
                _step((r, e) => {
                    _step(maincb, arr, index + 1, env, encapped_obj, r, e)
                }, arr[index + 1], -1, env, encapped_obj)
            } catch (e) {
                // return maincb(ERROR, e);
                return _step(maincb, arr, index + 1, env, encapped_obj, ERROR, e)
            }
        });
    }
}

function run(context, arr, cb, _env) {
    context = context || {};
    _env = _env || {};
    if (!!arr) {
        _step(cb, arr, -1, _env, context);
    } else {
        process.nextTick(() => { cb(COMPLETE); });
    }
    context.events = context.events || new AsyncEventEmitter();
    return context.events;
}

module.exports = {
    run: run
};