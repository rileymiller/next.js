"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.adapter = adapter;
exports.blockUnallowedResponse = blockUnallowedResponse;
var _error = require("./error");
var _utils = require("./utils");
var _fetchEvent = require("./spec-extension/fetch-event");
var _request = require("./spec-extension/request");
var _response = require("./spec-extension/response");
var _nextUrl = require("./next-url");
async function adapter(params) {
    const request = new NextRequestHint({
        page: params.page,
        input: params.request.url,
        init: {
            body: params.request.body,
            geo: params.request.geo,
            headers: (0, _utils).fromNodeHeaders(params.request.headers),
            ip: params.request.ip,
            method: params.request.method,
            nextConfig: params.request.nextConfig,
            page: params.request.page
        }
    });
    const event = new _fetchEvent.NextFetchEvent({
        request,
        page: params.page
    });
    const response = await params.handler(request, event);
    /**
   * For rewrites we must always include the locale in the final pathname
   * so we re-create the NextURL forcing it to include it when the it is
   * an internal rewrite.
   */ if (response === null || response === void 0 ? void 0 : response.headers.has('x-middleware-rewrite')) {
        const url = new _nextUrl.NextURL(response.headers.get('x-middleware-rewrite'), {
            forceLocale: true,
            headers: params.request.headers,
            nextConfig: params.request.nextConfig
        });
        if (url.host === request.nextUrl.host) {
            response.headers.set('x-middleware-rewrite', String(new _nextUrl.NextURL(response.headers.get('x-middleware-rewrite'), {
                forceLocale: true,
                headers: params.request.headers,
                nextConfig: params.request.nextConfig
            })));
        }
    }
    return {
        response: response || _response.NextResponse.next(),
        waitUntil: Promise.all(event[_fetchEvent.waitUntilSymbol])
    };
}
function blockUnallowedResponse(promise) {
    return promise.then((result)=>{
        var ref;
        if ((ref = result.response) === null || ref === void 0 ? void 0 : ref.body) {
            console.error(new Error(`A middleware can not alter response's body. Learn more: https://nextjs.org/docs/messages/returning-response-body-in-middleware`));
            return {
                ...result,
                response: new Response('Internal Server Error', {
                    status: 500,
                    statusText: 'Internal Server Error'
                })
            };
        }
        return result;
    });
}
class NextRequestHint extends _request.NextRequest {
    constructor(params){
        super(params.input, params.init);
        this.sourcePage = params.page;
    }
    get request() {
        throw new _error.DeprecationError({
            page: this.sourcePage
        });
    }
    respondWith() {
        throw new _error.DeprecationError({
            page: this.sourcePage
        });
    }
    waitUntil() {
        throw new _error.DeprecationError({
            page: this.sourcePage
        });
    }
}

//# sourceMappingURL=adapter.js.map