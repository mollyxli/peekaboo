const { execSync } = require('child_process')
const path = require('path')

exports.default = async function (context) {
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
  console.log(`  • stripping xattrs from ${appPath}`)
  // -r recursive, -c remove all attrs; also explicitly remove provenance
  execSync(`xattr -cr "${appPath}"`, { stdio: 'inherit', shell: '/bin/bash' })
  execSync(`find "${appPath}" -name '._*' -delete 2>/dev/null || true`, { stdio: 'inherit', shell: '/bin/bash' })
  execSync(`find "${appPath}" -name '.DS_Store' -delete 2>/dev/null || true`, { stdio: 'inherit', shell: '/bin/bash' })
}
