# tag
Tag made using this action are automatically signed by GitHub and will be marked as verified in the user interface.

### Example
```yaml
jobs:
  example:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - runs: |
          date > dummy.txt
          git add dummy.txt

      - uses: qoomon/actions--tag@v1
        with:
          name: 'v1.0.0'
          message: 'work, work'
```

### Inputs
```yaml
  token:
    description: 'A GitHub access token'
    required: true
    default: ${{ github.token }}
  remoteName:
    description: 'The remote name to create the commit on'
    required: true
    default: 'origin'
  name:
    description: 'The tag name'
    required: true
  message:
    description: 'The tag message'
  recreate:
    description: 'If true, an annotated tag will be recreated, instead of creating a new one'
```

### Outputs
```yaml
  tag:
    description: 'The SHA of the tag'
```

## Development
### Release New Action Version
Trigger [Release Version workflow](/actions/workflows/action-release.yaml)
