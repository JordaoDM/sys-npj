const { sequelize } = require('../models/indexModel');

function normalizeBrazilianText(text) {
  if (!text || typeof text !== 'string') return text;

  let fixed = text.trim();

  const replacements = [
    ['Ã§', 'ç'], ['Ã£', 'ã'], ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'],
    ['Ã¢', 'â'], ['Ãª', 'ê'], ['Ã´', 'ô'], ['Ã ', 'à'], ['Ã¨', 'è'], ['Ã¬', 'ì'], ['Ã²', 'ò'],
    ['Ã¹', 'ù'], ['Ã…', 'Å'], ['Ã‡', 'Ç'], ['Â°', '°'], ['â€™', '’'], ['â€', '”'], ['â€œ', '“'],
    ['â€', '“'], ['ÃƒÂ', 'Ã'], ['Ã‚', 'Â']
  ];

  replacements.forEach(([wrong, correct]) => {
    fixed = fixed.split(wrong).join(correct);
  });

  fixed = fixed
    .replace(/Ã([\u0080-\u00BF])/g, (match, c) => String.fromCharCode(c.charCodeAt(0)))
    .replace(/\uFFFD/g, '')
    .replace(/�/g, '');

  const commonCorrections = [
    { from: /Cvel/gi, to: 'Cível' },
    { from: /Cuiab/gi, to: 'Cuiabá' },
    { from: /Infncia/gi, to: 'Infância' },
    { from: /Violncia/gi, to: 'Violência' },
    { from: /Domstica/gi, to: 'Doméstica' },
    { from: /Execues/gi, to: 'Execuções' },
    { from: /Falncias/gi, to: 'Falências' },
    { from: /Famlia/gi, to: 'Família' },
    { from: /Pblicos/gi, to: 'Públicos' },
    { from: /Vrzea/gi, to: 'Várzea' },
    { from: /Justia/gi, to: 'Justiça' },
    { from: /Tramitao/gi, to: 'Tramitação' },
    { from: /Tramitacao/gi, to: 'Tramitação' },
    { from: /Civel/gi, to: 'Cível' },
    { from: /Civl/gi, to: 'Cível' },
    { from: /Criminal/gi, to: 'Criminal' }
  ];

  commonCorrections.forEach(({ from, to }) => {
    fixed = fixed.replace(from, to);
  });

  return fixed;
}

function fixEncoding(text) {
  return normalizeBrazilianText(text);
}

async function fixDatabaseEncoding() {
  try {
    console.log(' Corrigindo encoding no banco de dados...');
    
    const queries = [
      `UPDATE agendamentos SET 
       titulo = REPLACE(REPLACE(REPLACE(titulo, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á'),
       descricao = REPLACE(REPLACE(REPLACE(descricao, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á'),
       local = REPLACE(REPLACE(REPLACE(local, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á')
       WHERE titulo LIKE '%Ã%' OR descricao LIKE '%Ã%' OR local LIKE '%Ã%'`,
      
      `UPDATE processos SET 
       descricao = REPLACE(REPLACE(REPLACE(descricao, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á'),
       assistido = REPLACE(REPLACE(REPLACE(assistido, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á'),
       observacoes = REPLACE(REPLACE(REPLACE(observacoes, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á')
       WHERE descricao LIKE '%Ã%' OR assistido LIKE '%Ã%' OR observacoes LIKE '%Ã%'`,
      
      `UPDATE usuarios SET 
       nome = REPLACE(REPLACE(REPLACE(nome, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á')
       WHERE nome LIKE '%Ã%'`,
       
      `UPDATE fases SET nome = REPLACE(REPLACE(REPLACE(nome, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á') WHERE nome LIKE '%Ã%'`,
      `UPDATE materias_assunto SET nome = REPLACE(REPLACE(REPLACE(nome, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á') WHERE nome LIKE '%Ã%'`,
      `UPDATE locais_tramitacao SET nome = REPLACE(REPLACE(REPLACE(nome, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á') WHERE nome LIKE '%Ã%'`,
      `UPDATE diligencias SET nome = REPLACE(REPLACE(REPLACE(nome, 'Ã§', 'ç'), 'Ã£', 'ã'), 'Ã¡', 'á') WHERE nome LIKE '%Ã%'`
    ];
    
    for (const query of queries) {
      try {
        const [results] = await sequelize.query(query);
        if (results.affectedRows > 0) {
          console.log(` Corrigidos ${results.affectedRows} registros`);
        }
      } catch (error) {
        console.log(`️ Erro em query (normal se tabela não existir):`, error.message);
      }
    }
    
    console.log(' Correção de encoding concluída');
    return true;
  } catch (error) {
    console.error(' Erro ao corrigir encoding:', error);
    return false;
  }
}

module.exports = {
  fixEncoding,
  normalizeBrazilianText,
  fixDatabaseEncoding
};
