const { normalizeBrazilianText } = require('../../../utils/encodingUtils');

describe('normalizeBrazilianText', () => {
  test.each([
    ['Cuiabá', 'Cuiabá'],
    ['Cuiaba', 'Cuiabá'],
    ['Vara Cível de Cuiabá', 'Vara Cível de Cuiabá'],
    ['Vara Cível de Cuiaba', 'Vara Cível de Cuiabá']
  ])('normaliza %s sem duplicar a última letra', (entrada, esperado) => {
    expect(normalizeBrazilianText(entrada)).toBe(esperado);
  });
});
