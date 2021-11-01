module.exports = {
    root: true,
    extends: 'airbnb-base',
    env: {
        node: true
    },
    rules: {
        indent: ['error', 4],
        strict: 'off',
        'no-console': 'off',
        'import/no-unresolved': 'off',
        'import/prefer-default-export': 'off',
        'global-require': 'off',
        'no-restricted-globals': 'off',
        'max-len': 'off',
        'no-await-in-loop': 'off'
    }
}