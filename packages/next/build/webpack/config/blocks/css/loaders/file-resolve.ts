export function cssFileResolve(
  url: string,
  _resourcePath: string,
  urlImports: any,
  cssFileResolveIgnoreUrlPattern?: RegExp
) {
  if (url.startsWith('/')) {
    return false
  }
  if (!urlImports && /^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return false
  }

  if(cssFileResolveIgnoreUrlPattern && cssFileResolveIgnoreUrlPattern.test(url)) {
    return false
  }

  
  return true
}
