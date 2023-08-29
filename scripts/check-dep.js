const ncu = require('npm-check-updates')
const axios = require('axios')

async function getRepositoryInfo (packageName) {
  try {
    const { data } = await axios.get(`https://registry.npmjs.org/${packageName}`)
    const repository = data.repository
    if (repository && repository.url) {
      const gitUrl = repository.url.replace('git+', '').replace('.git', '')
      const isGitHub = gitUrl.includes('github.com')

      return isGitHub ? `${gitUrl}/releases` : gitUrl
    }
  } catch (error) {
    console.error(`Error fetching repository info for ${packageName}: ${error.message}`)
  }
  return null
}

async function checkUpdates () {
  const updated = await ncu.run({
    packageFile: './package.json',
    upgrade: false
  })

  if (!Object.keys(updated).length) {
    console.log('All dependencies are up-to-date!')
    return
  }

  console.log('Dependencies that need to be updated:')
  for (const [key] of Object.entries(updated)) {
    const repoUrl = await getRepositoryInfo(key)
    console.log(`${key}: ${updated[key]} ${repoUrl ? `- [GitHub/Repo](${repoUrl})` : ''}`)
  }
}

checkUpdates().catch(err => console.error(err))
