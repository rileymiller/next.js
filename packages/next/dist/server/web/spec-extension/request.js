"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.INTERNALS = void 0;
var _nextUrl = require("../next-url");
var _utils = require("../../utils");
var _utils1 = require("../utils");
var _uaParserJs = _interopRequireDefault(require("next/dist/compiled/ua-parser-js"));
var _cookies = require("./cookies");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const INTERNALS = Symbol('internal request');
exports.INTERNALS = INTERNALS;
class NextRequest extends Request {
    constructor(input, init = {}){
        const url = typeof input === 'string' ? input : input.url;
        (0, _utils1).validateURL(url);
        super(input, init);
        this[INTERNALS] = {
            cookies: new _cookies.NextCookies(this),
            geo: init.geo || {},
            ip: init.ip,
            page: init.page,
            url: new _nextUrl.NextURL(url, {
                headers: (0, _utils1).toNodeHeaders(this.headers),
                nextConfig: init.nextConfig
            })
        };
    }
    get cookies() {
        return this[INTERNALS].cookies;
    }
    get geo() {
        return this[INTERNALS].geo;
    }
    get ip() {
        return this[INTERNALS].ip;
    }
    get preflight() {
        return this.headers.get('x-middleware-preflight');
    }
    get nextUrl() {
        return this[INTERNALS].url;
    }
    get page() {
        var ref, ref1;
        return {
            name: (ref = this[INTERNALS].page) === null || ref === void 0 ? void 0 : ref.name,
            params: (ref1 = this[INTERNALS].page) === null || ref1 === void 0 ? void 0 : ref1.params
        };
    }
    get ua() {
        if (typeof this[INTERNALS].ua !== 'undefined') {
            return this[INTERNALS].ua || undefined;
        }
        const uaString = this.headers.get('user-agent');
        if (!uaString) {
            this[INTERNALS].ua = null;
            return this[INTERNALS].ua || undefined;
        }
        this[INTERNALS].ua = {
            ...(0, _uaParserJs).default(uaString),
            isBot: (0, _utils).isBot(uaString)
        };
        return this[INTERNALS].ua;
    }
    get url() {
        return this[INTERNALS].url.toString();
    }
}
exports.NextRequest = NextRequest;

//# sourceMappingURL=request.js.map