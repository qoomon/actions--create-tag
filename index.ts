import * as core from '@actions/core'
import * as github from '@actions/github'
import {exec, getInput, run} from './lib/actions.js'
// see https://github.com/actions/toolkit for more github actions libraries
import {getRemoteUrl, getTagDetails} from './lib/git.js'
import {createTag, parseRepositoryFromUrl} from './lib/github.js'
import {fileURLToPath} from 'url'

export const action = () => run(async () => {
  const input = {
    token: getInput('token', {required: true})!,
    workingDirectory: getInput('working-directory') ?? '.',
    remoteName: getInput('remoteName') ?? 'origin',
    name: getInput('name', {required: true})!,
  }

  // if (!input.token.startsWith('ghs_')) {
  //   core.setFailed(`Only GitHub app tokens (ghs_***) can be used for signing tags.`)
  //   return
  // }

  const repositoryRemoteUrl = await getRemoteUrl()
  const repository = parseRepositoryFromUrl(repositoryRemoteUrl)

  const recentTag = await getTagDetails(input.name)
  if (recentTag.type !== 'tag') {
    core.setFailed(`Only annotated tags can be signed`)
    return
  }

  const octokit = github.getOctokit(input.token)

  const signedTag = await createTag(octokit, repository, {
    tag: recentTag.name,
    subject: recentTag.subject,
    body: recentTag.body,
    sha: recentTag.targetSha!,
  })

  core.info('Syncing local repository ...')
  await exec(`git fetch`, [input.remoteName, signedTag.sha])
  await exec(`git tag -f ${recentTag.name} ${signedTag.sha}`)
})

// Execute the action, if running as main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  action()
}
