"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = AppRouter;
var _react = _interopRequireDefault(require("react"));
var _reactServerDomWebpack = require("next/dist/compiled/react-server-dom-webpack");
var _appRouterContext = require("../../shared/lib/app-router-context");
function AppRouter({ initialUrl , children  }) {
    var ref;
    const initialState = {
        url: initialUrl
    };
    const previousUrlRef = _react.default.useRef(initialState);
    const [current, setCurrent] = _react.default.useState(initialState);
    const appRouter = _react.default.useMemo(()=>{
        return {
            prefetch: ()=>{},
            replace: (url)=>{
                previousUrlRef.current = current;
                setCurrent(_objectSpread({}, current, {
                    url
                }));
                // TODO: update url eagerly or not?
                window.history.replaceState(current, '', url);
            },
            push: (url)=>{
                previousUrlRef.current = current;
                setCurrent(_objectSpread({}, current, {
                    url
                }));
                // TODO: update url eagerly or not?
                window.history.pushState(current, '', url);
            },
            url: current.url
        };
    }, [
        current
    ]);
    if (typeof window !== 'undefined') {
        // @ts-ignore TODO: for testing
        window.appRouter = appRouter;
        console.log({
            appRouter,
            previous: previousUrlRef.current,
            current
        });
    }
    let root;
    if (current.url !== ((ref = previousUrlRef.current) === null || ref === void 0 ? void 0 : ref.url)) {
        // eslint-disable-next-line
        const data = fetchServerResponse(current.url);
        root = data.readRoot();
    }
    return(/*#__PURE__*/ _react.default.createElement(_appRouterContext.AppRouterContext.Provider, {
        value: appRouter
    }, root ? root : children));
}
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _objectSpread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _defineProperty(target, key, source[key]);
        });
    }
    return target;
}
function createResponseCache() {
    return new Map();
}
const rscCache = createResponseCache();
const getCacheKey = ()=>{
    const { pathname , search  } = location;
    return pathname + search;
};
function fetchFlight(href) {
    const url = new URL(href, location.origin);
    const searchParams = url.searchParams;
    searchParams.append('__flight__', '1');
    return fetch(url.toString());
}
function fetchServerResponse(cacheKey) {
    let response = rscCache.get(cacheKey);
    if (response) return response;
    response = (0, _reactServerDomWebpack).createFromFetch(fetchFlight(getCacheKey()));
    rscCache.set(cacheKey, response);
    return response;
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=app-router.client.js.map