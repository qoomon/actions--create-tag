# tag

Tag made using this action are automatically signed by GitHub and will be marked as verified in the user interface.

### Example

```yaml
jobs:
  example:
    runs-on: ubuntu-latest
    env:
      TAG_NAME: v1.0.0
    steps:
      - uses: actions/checkout@v4
      - runs: |
          git tag -am "${TAG_NAME}" "${TAG_NAME}"

      - name: Sign tag ${{ env.TAG_NAME }}
        uses: qoomon/actions--tag@v1
        with:
          name: ${{ env.TAG_NAME }}

      - runs: |
          git push origin "${TAG_NAME}"
```

### Inputs

```yaml
  token:
    description: 'A GitHub access token'
    required: true
    default: ${{ github.token }}
  working-directory:
    description: 'The working directory'
    required: true
    default: '.'
  remoteName:
    description: 'The remote name to create the commit on'
    required: true
    default: 'origin'
  name:
    description: 'The tag name'
    required: true
```

### Outputs

```yaml
  tag:
    description: 'The SHA of the tag'
```

## Development

### Release New Action Version

Trigger [Release Version workflow](/actions/workflows/action-release.yaml)
