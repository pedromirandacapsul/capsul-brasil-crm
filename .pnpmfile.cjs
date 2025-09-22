module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === '@prisma/client' ||
          pkg.name === '@prisma/engines' ||
          pkg.name === '@swc/core' ||
          pkg.name === 'argon2' ||
          pkg.name === 'esbuild' ||
          pkg.name === 'msgpackr-extract' ||
          pkg.name === 'prisma' ||
          pkg.name === 'unrs-resolver') {
        pkg.scripts = pkg.scripts || {}
      }
      return pkg
    }
  }
}