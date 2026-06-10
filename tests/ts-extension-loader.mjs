export async function resolve(specifier, context, nextResolve) {
  if (isRelativeSpecifier(specifier) && !hasExtension(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch (error) {
      if (error?.code !== 'ERR_MODULE_NOT_FOUND') {
        throw error;
      }
    }
  }

  return nextResolve(specifier, context);
}

function isRelativeSpecifier(specifier) {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

function hasExtension(specifier) {
  const lastSegment = specifier.split('/').at(-1) ?? '';
  return lastSegment.includes('.');
}
