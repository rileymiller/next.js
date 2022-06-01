"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.run = run;
var _context = require("./context");
async function run(params) {
    const { runtime , evaluateInContext  } = await (0, _context).getModuleContext({
        moduleName: params.name,
        onWarning: params.onWarning,
        useCache: params.useCache !== false,
        env: params.env,
        wasm: params.wasm
    });
    for (const paramPath of params.paths){
        evaluateInContext(paramPath);
    }
    const subreq = params.request.headers[`x-middleware-subrequest`];
    const subrequests = typeof subreq === 'string' ? subreq.split(':') : [];
    if (subrequests.includes(params.name)) {
        return {
            waitUntil: Promise.resolve(),
            response: new runtime.context.Response(null, {
                headers: {
                    'x-middleware-next': '1'
                }
            })
        };
    }
    return runtime.context._ENTRIES[`middleware_${params.name}`].default({
        request: params.request
    });
}

//# sourceMappingURL=sandbox.js.map