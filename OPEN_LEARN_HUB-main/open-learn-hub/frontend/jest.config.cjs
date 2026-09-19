module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^react(.*)$': '<rootDir>/node_modules/react$1'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
}
