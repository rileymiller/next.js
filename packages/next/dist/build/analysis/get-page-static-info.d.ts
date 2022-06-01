import type { PageRuntime } from '../../server/config-shared';
import type { NextConfig } from '../../server/config-shared';
export interface PageStaticInfo {
    runtime?: PageRuntime;
    ssg?: boolean;
    ssr?: boolean;
}
/**
 * For a given pageFilePath and nextConfig, if the config supports it, this
 * function will read the file and return the runtime that should be used.
 * It will look into the file content only if the page *requires* a runtime
 * to be specified, that is, when gSSP or gSP is used.
 * Related discussion: https://github.com/vercel/next.js/discussions/34179
 */
export declare function getPageStaticInfo(params: {
    nextConfig: Partial<NextConfig>;
    pageFilePath: string;
    isDev?: boolean;
}): Promise<PageStaticInfo>;
