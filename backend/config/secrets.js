function requireSecret(name, minimumLength = 32) {
  const value = process.env[name];

  if (!value || value.length < minimumLength) {
    const error = new Error(`${name} deve estar definido e possuir pelo menos ${minimumLength} caracteres`);
    error.code = 'CONFIGURATION_ERROR';
    throw error;
  }

  return value;
}

module.exports = {
  getJwtSecret: () => requireSecret('JWT_SECRET'),
  getJwtRefreshSecret: () => requireSecret('JWT_REFRESH_SECRET')
};
